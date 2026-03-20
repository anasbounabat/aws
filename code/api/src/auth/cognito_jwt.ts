import { createRemoteJWKSet, jwtVerify } from 'jose'

type Verified = {
  sub: string
  token_use: 'id' | 'access'
  scope?: string
  email?: string
}

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null

function issuer() {
  const poolId = process.env.COGNITO_USER_POOL_ID
  if (!poolId) throw new Error('COGNITO_USER_POOL_ID is required')
  const region = poolId.split('_')[0]
  return `https://cognito-idp.${region}.amazonaws.com/${poolId}`
}

function audience() {
  const clientId = process.env.COGNITO_CLIENT_ID
  if (!clientId) throw new Error('COGNITO_CLIENT_ID is required')
  return clientId
}

function jwksSet() {
  if (jwks) return jwks
  jwks = createRemoteJWKSet(new URL(`${issuer()}/.well-known/jwks.json`))
  return jwks
}

export async function verifyCognitoJwt(token: string): Promise<Verified> {
  const { payload } = await jwtVerify(token, jwksSet(), {
    issuer: issuer(),
    audience: audience()
  })

  const sub = String(payload.sub || '')
  const token_use = String(payload.token_use || '')
  if (!sub) throw new Error('missing sub')
  if (token_use !== 'id' && token_use !== 'access') throw new Error('invalid token_use')

  return {
    sub,
    token_use: token_use as 'id' | 'access',
    scope: typeof payload.scope === 'string' ? payload.scope : undefined,
    email: typeof payload.email === 'string' ? payload.email : undefined
  }
}

