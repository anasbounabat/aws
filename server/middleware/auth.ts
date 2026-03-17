import { verifyAuthToken } from '../utils/jwt'

const publicApiPaths = new Set<string>([
  '/api/auth/login',
  '/api/auth/register'
])

export default defineEventHandler(async (event) => {
  const path = event.path || ''
  if (!path.startsWith('/api/')) return
  if (publicApiPaths.has(path)) return

  const header = getHeader(event, 'authorization') || ''
  const match = header.match(/^Bearer\s+(.+)$/i)
  if (!match) {
    throw createError({ statusCode: 401, statusMessage: 'Missing Bearer token' })
  }

  try {
    event.context.auth = await verifyAuthToken(match[1]!)
  } catch {
    throw createError({ statusCode: 401, statusMessage: 'Invalid token' })
  }
})

