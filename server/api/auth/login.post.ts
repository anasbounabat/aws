import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { db } from '../../utils/db'
import { signAuthToken } from '../../utils/jwt'

const BodySchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1).max(200)
})

export default defineEventHandler(async (event) => {
  const body = BodySchema.parse(await readBody(event))
  const sql = db()

  const rows = await sql<
    { id: number; email: string; role: 'admin' | 'user'; password_hash: string }[]
  >`
    SELECT id, email, role, password_hash
    FROM users
    WHERE email = ${body.email}
    LIMIT 1
  `

  const user = rows[0]
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }

  const ok = await bcrypt.compare(body.password, user.password_hash)
  if (!ok) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }

  const token = await signAuthToken({ id: user.id, email: user.email, role: user.role })

  return {
    token,
    user: { id: user.id, email: user.email, role: user.role }
  }
})

