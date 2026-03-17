import { db } from '../../../utils/db'
import { requireAuth } from '../../../utils/http'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const projectId = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(projectId)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid project id' })
  }

  const sql = db()

  const access = await sql<{ ok: boolean }[]>`
    SELECT true AS ok
    FROM projects p
    INNER JOIN memberships m ON m.team_id = p.team_id
    WHERE p.id = ${projectId} AND m.user_id = ${auth.id}
    LIMIT 1
  `
  if (!access.length) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found' })
  }

  const tasks = await sql<
    { id: number; title: string; description: string | null; status: 'TODO' | 'DOING' | 'DONE'; project_id: number; assigned_to: number | null }[]
  >`
    SELECT id, title, description, status, project_id, assigned_to
    FROM tasks
    WHERE project_id = ${projectId}
    ORDER BY id DESC
  `

  const assets = await sql<{ id: number; task_id: number; s3_url: string }[]>`
    SELECT id, task_id, s3_url
    FROM assets
    WHERE task_id IN (
      SELECT id FROM tasks WHERE project_id = ${projectId}
    )
    ORDER BY id DESC
  `

  return { tasks, assets }
})

