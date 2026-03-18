import type { Context, Next } from 'hono'
import { verifyCognitoJwt } from './cognito_jwt'
import { db } from '../db'

export type Authed = { sub: string; role: 'admin' | 'user'; email?: string }

export async function authRequired(c: Context, next: Next) {
  const header = c.req.header('authorization') || ''
  const match = header.match(/^Bearer\s+(.+)$/i)
  if (!match) return c.json({ error: 'Unauthorized' }, 401)

  try {
    const verified = await verifyCognitoJwt(match[1]!)
    c.set('sub', verified.sub)

    const sql = db()
    const rows = await sql<{ role: 'admin' | 'user' }[]>`
      SELECT role FROM app_users WHERE user_sub = ${verified.sub} LIMIT 1
    `

    // Default role if missing: user (auto-provision)
    const role = rows[0]?.role ?? 'user'
    if (!rows.length) {
      await sql`
        INSERT INTO app_users (user_sub, role)
        VALUES (${verified.sub}, ${role})
        ON CONFLICT (user_sub) DO NOTHING
      `
    }

    c.set('auth', { sub: verified.sub, role, email: verified.email } satisfies Authed)
    await next()
  } catch {
    return c.json({ error: 'Unauthorized' }, 401)
  }
}

export async function adminRequired(c: Context, next: Next) {
  await authRequired(c, async () => {
    const auth = c.get('auth') as Authed
    if (auth.role !== 'admin') return c.json({ error: 'Forbidden' }, 403)
    await next()
  })
}

