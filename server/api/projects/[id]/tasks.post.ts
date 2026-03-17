import { z } from 'zod'
import { db } from '../../../utils/db'
import { requireAuth } from '../../../utils/http'

const BodySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  assigned_to: z.number().int().positive().nullable().optional()
})

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const projectId = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(projectId)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid project id' })
  }

  const body = BodySchema.parse(await readBody(event))
  const sql = db()

  const access = await sql<{ team_id: number }[]>`
    SELECT p.team_id
    FROM projects p
    INNER JOIN memberships m ON m.team_id = p.team_id
    WHERE p.id = ${projectId} AND m.user_id = ${auth.id}
    LIMIT 1
  `
  if (!access.length) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found' })
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

  const task = await sql<
    { id: number; title: string; description: string | null; status: 'TODO' | 'DOING' | 'DONE'; project_id: number; assigned_to: number | null }[]
  >`
    INSERT INTO tasks (title, description, status, project_id, assigned_to)
    VALUES (${body.title}, ${body.description || null}, 'TODO', ${projectId}, ${body.assigned_to ?? null})
    RETURNING id, title, description, status, project_id, assigned_to
  `

  return { task: task[0]! }
})

