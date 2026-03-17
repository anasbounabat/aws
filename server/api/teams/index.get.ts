import { db } from '../../utils/db'
import { requireAuth } from '../../utils/http'

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

  return { teams }
})

