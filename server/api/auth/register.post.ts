import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { db } from '../../utils/db'
import { signAuthToken } from '../../utils/jwt'

const BodySchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(200)
})

export default defineEventHandler(async (event) => {
  const body = BodySchema.parse(await readBody(event))
  const sql = db()

  const existing = await sql<{ id: number }[]>`
    SELECT id FROM users WHERE email = ${body.email} LIMIT 1
  `
  if (existing.length) {
    throw createError({ statusCode: 409, statusMessage: 'Email already registered' })
  }

  const password_hash = await bcrypt.hash(body.password, 12)

  const inserted = await sql<{ id: number; email: string; role: 'admin' | 'user' }[]>`
    INSERT INTO users (email, password_hash, role)
    VALUES (${body.email}, ${password_hash}, 'user')
    RETURNING id, email, role
  `
  const user = inserted[0]!

  const team = await sql<{ id: number }[]>`
    INSERT INTO teams (name, owner_id)
    VALUES (${`${user.email.split('@')[0]}'s team`}, ${user.id})
    RETURNING id
  `

  await sql`
    INSERT INTO memberships (user_id, team_id)
    VALUES (${user.id}, ${team[0]!.id})
  `

  const token = await signAuthToken({ id: user.id, email: user.email, role: user.role })

  return {
    token,
    user
  }
})

