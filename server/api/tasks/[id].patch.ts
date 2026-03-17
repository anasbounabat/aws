import { z } from 'zod'
import { db } from '../../utils/db'
import { requireAuth } from '../../utils/http'

const BodySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).nullable().optional(),
  status: z.enum(['TODO', 'DOING', 'DONE']).optional(),
  assigned_to: z.number().int().positive().nullable().optional()
})

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const taskId = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(taskId)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid task id' })
  }

  const body = BodySchema.parse(await readBody(event))
  const sql = db()

  const access = await sql<{ id: number; team_id: number }[]>`
    SELECT t.id, p.team_id
    FROM tasks t
    INNER JOIN projects p ON p.id = t.project_id
    INNER JOIN memberships m ON m.team_id = p.team_id
    WHERE t.id = ${taskId} AND m.user_id = ${auth.id}
    LIMIT 1
  `
  if (!access.length) {
    throw createError({ statusCode: 404, statusMessage: 'Task not found' })
  }

  if (body.assigned_to) {
    const canAssign = await sql<{ ok: boolean }[]>`
      SELECT true AS ok
      FROM memberships
      WHERE user_id = ${body.assigned_to} AND team_id = ${access[0]!.team_id}
      LIMIT 1
    `
    if (!canAssign.length) {
      throw createError({ statusCode: 400, statusMessage: 'assigned_to is not a team member' })
    }
  }

  const updated = await sql<
    { id: number; title: string; description: string | null; status: 'TODO' | 'DOING' | 'DONE'; project_id: number; assigned_to: number | null }[]
  >`
    UPDATE tasks
    SET
      title = COALESCE(${body.title ?? null}, title),
      description = COALESCE(${body.description ?? null}, description),
      status = COALESCE(${body.status ?? null}::task_status, status),
      assigned_to = COALESCE(${body.assigned_to ?? null}, assigned_to),
      updated_at = NOW()
    WHERE id = ${taskId}
    RETURNING id, title, description, status, project_id, assigned_to
  `

  return { task: updated[0]! }
})

