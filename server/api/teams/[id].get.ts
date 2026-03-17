import { db } from '../../utils/db'
import { requireAuth } from '../../utils/http'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const teamId = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(teamId)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid team id' })
  }

  const sql = db()

  const member = await sql<{ ok: boolean }[]>`
    SELECT true AS ok
    FROM memberships
    WHERE user_id = ${auth.id} AND team_id = ${teamId}
    LIMIT 1
  `
  if (!member.length) {
    throw createError({ statusCode: 404, statusMessage: 'Team not found' })
  }

  const team = await sql<{ id: number; name: string; owner_id: number }[]>`
    SELECT id, name, owner_id
    FROM teams
    WHERE id = ${teamId}
    LIMIT 1
  `

  const members = await sql<{ id: number; email: string; role: 'admin' | 'user' }[]>`
    SELECT u.id, u.email, u.role
    FROM users u
    INNER JOIN memberships m ON m.user_id = u.id
    WHERE m.team_id = ${teamId}
    ORDER BY u.id ASC
  `

  const projects = await sql<{ id: number; name: string; team_id: number }[]>`
    SELECT id, name, team_id
    FROM projects
    WHERE team_id = ${teamId}
    ORDER BY id DESC
  `

  return { team: team[0]!, members, projects }
})

