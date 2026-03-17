import { db } from '../utils/db'
import { requireAuth } from '../utils/http'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const sql = db()

  const teams = await sql<
    { id: number; name: string; owner_id: number }[]
  >`
    SELECT t.id, t.name, t.owner_id
    FROM teams t
    INNER JOIN memberships m ON m.team_id = t.id
    WHERE m.user_id = ${auth.id}
    ORDER BY t.id DESC
  `

  const projects = await sql<
    { id: number; name: string; team_id: number; team_name: string }[]
  >`
    SELECT p.id, p.name, p.team_id, t.name AS team_name
    FROM projects p
    INNER JOIN teams t ON t.id = p.team_id
    INNER JOIN memberships m ON m.team_id = t.id
    WHERE m.user_id = ${auth.id}
    ORDER BY p.id DESC
  `

  return { teams, projects }
})

