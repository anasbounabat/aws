import { SignJWT, jwtVerify } from 'jose'

export type AppJwtPayload = {
  sub: string
  role: 'admin' | 'user'
}

function secret() {
  const s = process.env.JWT_SECRET
  if (!s) throw new Error('JWT_SECRET is required')
  return new TextEncoder().encode(s)
}

export async function signAppJwt(payload: AppJwtPayload) {
  const expiresIn = Number(process.env.JWT_EXPIRES_IN_SECONDS || 60 * 60 * 24 * 7)
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime(`${expiresIn}s`)
    .sign(secret())
}

export async function verifyAppJwt(token: string): Promise<AppJwtPayload> {
  const { payload } = await jwtVerify(token, secret(), { algorithms: ['HS256'] })
  const sub = String(payload.sub || '')
  const role = String(payload.role || '')
  if (!sub) throw new Error('missing sub')
  if (role !== 'admin' && role !== 'user') throw new Error('invalid role')
  return { sub, role: role as 'admin' | 'user' }
}

