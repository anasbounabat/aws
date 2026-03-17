import { z } from 'zod'
import { db } from '../../utils/db'
import { requireAuth } from '../../utils/http'

const BodySchema = z.object({
  name: z.string().min(1).max(100)
})

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const body = BodySchema.parse(await readBody(event))
  const sql = db()

  const team = await sql<{ id: number; name: string; owner_id: number }[]>`
    INSERT INTO teams (name, owner_id)
    VALUES (${body.name}, ${auth.id})
    RETURNING id, name, owner_id
  `

  await sql`
    INSERT INTO memberships (user_id, team_id)
    VALUES (${auth.id}, ${team[0]!.id})
    ON CONFLICT DO NOTHING
  `

  return { team: team[0]! }
})

