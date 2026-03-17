import { SignJWT, jwtVerify } from 'jose'

export type AuthRole = 'admin' | 'user'

export type AuthPayload = {
  id: number
  email: string
  role: AuthRole
}

function getSecret() {
  const { jwtSecret } = useRuntimeConfig()
  if (!jwtSecret) {
    throw createError({ statusCode: 500, statusMessage: 'JWT_SECRET is not configured' })
  }
  return new TextEncoder().encode(jwtSecret)
}

export async function signAuthToken(payload: AuthPayload) {
  const { jwtExpiresInSeconds } = useRuntimeConfig()
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime(`${jwtExpiresInSeconds}s`)
    .sign(getSecret())
}

export async function verifyAuthToken(token: string): Promise<AuthPayload> {
  const { payload } = await jwtVerify(token, getSecret(), { algorithms: ['HS256'] })

  const id = Number(payload.id)
  const email = String(payload.email || '')
  const role = String(payload.role || '')

  if (!Number.isFinite(id) || !email || (role !== 'admin' && role !== 'user')) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid token payload' })
  }

  return { id, email, role: role as AuthRole }
}

