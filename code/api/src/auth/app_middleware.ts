import type { Context, Next } from 'hono'
import { verifyAppJwt } from './app_jwt'
import { db } from '../db'

export type AppAuth = { sub: string; role: 'admin' | 'user' }

export async function requireUser(c: Context, next: Next) {
  const header = c.req.header('authorization') || ''
  const match = header.match(/^Bearer\s+(.+)$/i)
  if (!match) {
    // eslint-disable-next-line no-console
    console.warn('[auth] Missing/invalid Authorization header')
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const verified = await verifyAppJwt(match[1]!)

    // Ensure user exists in DB (no email stored)
    const sql = db()
    await sql`
      INSERT INTO users (id, role)
      VALUES (${verified.sub}, ${verified.role})
      ON CONFLICT (id) DO NOTHING
    `

    c.set('auth', verified satisfies AppAuth)
    c.set('sub', verified.sub)
    await next()
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.warn('[auth] verifyAppJwt failed:', err?.message || err)
    return c.json({ error: 'Unauthorized' }, 401)
  }
}

export async function requireAdmin(c: Context, next: Next) {
  await requireUser(c, async () => {
    const auth = c.get('auth') as AppAuth
    if (auth.role !== 'admin') return c.json({ error: 'Forbidden' }, 403)
    await next()
  })
}

