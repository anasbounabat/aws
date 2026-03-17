import { db } from '../../utils/db'
import { requireAuth } from '../../utils/http'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const projectId = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(projectId)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid project id' })
  }

  const sql = db()

  const project = await sql<{ id: number; name: string; team_id: number; team_name: string }[]>`
    SELECT p.id, p.name, p.team_id, t.name AS team_name
    FROM projects p
    INNER JOIN teams t ON t.id = p.team_id
    WHERE p.id = ${projectId}
    LIMIT 1
  `
  if (!project.length) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found' })
  }

  const member = await sql<{ ok: boolean }[]>`
    SELECT true AS ok
    FROM memberships m
    WHERE m.user_id = ${auth.id} AND m.team_id = ${project[0]!.team_id}
    LIMIT 1
  `
  if (!member.length) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found' })
  }

  return { project: project[0]! }
})

