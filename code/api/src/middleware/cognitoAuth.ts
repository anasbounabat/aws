import type { Context, Next } from 'hono'
import { verifyCognitoJwt } from '../auth/cognito_jwt'

export async function cognitoAuth(c: Context, next: Next) {
  const header = c.req.header('authorization') || ''
  const match = header.match(/^Bearer\s+(.+)$/i)
  if (!match) return c.json({ error: 'Unauthorized' }, 401)

  try {
    const verified = await verifyCognitoJwt(match[1]!)
    c.set('sub', verified.sub)
    await next()
  } catch {
    return c.json({ error: 'Unauthorized' }, 401)
  }
}

