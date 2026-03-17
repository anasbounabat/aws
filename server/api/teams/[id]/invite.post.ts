import { z } from 'zod'
import { db } from '../../../utils/db'
import { requireAuth } from '../../../utils/http'

const BodySchema = z.object({
  email: z.string().email().toLowerCase()
})

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const teamId = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(teamId)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid team id' })
  }

  const body = BodySchema.parse(await readBody(event))
  const sql = db()

  const team = await sql<{ id: number; owner_id: number }[]>`
    SELECT id, owner_id FROM teams WHERE id = ${teamId} LIMIT 1
  `
  if (!team.length) {
    throw createError({ statusCode: 404, statusMessage: 'Team not found' })
  }
  if (team[0]!.owner_id !== auth.id) {
    throw createError({ statusCode: 403, statusMessage: 'Only the owner can invite members' })
  }

  const user = await sql<{ id: number }[]>`
    SELECT id FROM users WHERE email = ${body.email} LIMIT 1
  `
  if (!user.length) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  await sql`
    INSERT INTO memberships (user_id, team_id)
    VALUES (${user[0]!.id}, ${teamId})
    ON CONFLICT DO NOTHING
  `

  return { ok: true }
})

