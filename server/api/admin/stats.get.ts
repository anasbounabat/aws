import { db } from '../../utils/db'
import { requireAdmin } from '../../utils/http'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const sql = db()

  const [{ count: users }] = await sql<{ count: number }[]>`SELECT COUNT(*)::int AS count FROM users`
  const [{ count: teams }] = await sql<{ count: number }[]>`SELECT COUNT(*)::int AS count FROM teams`
  const [{ count: projects }] = await sql<{ count: number }[]>`SELECT COUNT(*)::int AS count FROM projects`
  const [{ count: tasks }] = await sql<{ count: number }[]>`SELECT COUNT(*)::int AS count FROM tasks`

  return { users, teams, projects, tasks }
})

