import { z } from 'zod'
import { db } from '../../utils/db'
import { requireAuth } from '../../utils/http'

const BodySchema = z.object({
  name: z.string().min(1).max(120),
  team_id: z.number().int().positive()
})

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const body = BodySchema.parse(await readBody(event))
  const sql = db()

  const member = await sql<{ ok: boolean }[]>`
    SELECT true AS ok
    FROM memberships
    WHERE user_id = ${auth.id} AND team_id = ${body.team_id}
    LIMIT 1
  `
  if (!member.length) {
    throw createError({ statusCode: 403, statusMessage: 'Not a team member' })
  }

  const project = await sql<{ id: number; name: string; team_id: number }[]>`
    INSERT INTO projects (name, team_id)
    VALUES (${body.name}, ${body.team_id})
    RETURNING id, name, team_id
  `

  return { project: project[0]! }
})

