import {
  CognitoIdentityProviderClient,
  AdminGetUserCommand,
  ListUsersCommand,
  AdminUpdateUserAttributesCommand
} from '@aws-sdk/client-cognito-identity-provider'

function client() {
  const poolId = process.env.COGNITO_USER_POOL_ID
  if (!poolId) throw new Error('COGNITO_USER_POOL_ID is required')
  const region = poolId.split('_')[0]
  return new CognitoIdentityProviderClient({ region })
}

function poolId() {
  const id = process.env.COGNITO_USER_POOL_ID
  if (!id) throw new Error('COGNITO_USER_POOL_ID is required')
  return id
}

export async function get_user_by_sub(sub: string) {
  try {
    const res = await client().send(
      new AdminGetUserCommand({
        UserPoolId: poolId(),
        Username: sub
      })
    )

    const attrs = new Map((res.UserAttributes || []).map((a) => [a.Name!, a.Value || '']))
    return {
      sub,
      email: attrs.get('email') || null,
      name: attrs.get('name') || attrs.get('given_name') || null
    }
  } catch (err: any) {
    // In dev/local setups, the server IAM role/user might not be allowed to call AdminGetUser.
    // `/me` should still work using only `sub`/`role` from the JWT + DB provisioning.
    // eslint-disable-next-line no-console
    console.warn('[cognito] get_user_by_sub failed:', err?.name || err?.__type || err)
    return { sub, email: null, name: null }
  }
}

export async function get_user_by_email(email: string) {
  const res = await client().send(
    new ListUsersCommand({
      UserPoolId: poolId(),
      Filter: `email = "${email}"`
    })
  )

  const u = res.Users?.[0]
  if (!u?.Username) return null
  return await get_user_by_sub(u.Username)
}

export async function update_user_by_sub(sub: string, attrs: { name?: string }) {
  const attributes = []
  if (attrs.name !== undefined) attributes.push({ Name: 'name', Value: attrs.name })

  if (!attributes.length) return { ok: true }

  await client().send(
    new AdminUpdateUserAttributesCommand({
      UserPoolId: poolId(),
      Username: sub,
      UserAttributes: attributes
    })
  )
  return { ok: true }
}

