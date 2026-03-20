import { Amplify } from 'aws-amplify'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const region = config.public.awsRegion
  const userPoolId = config.public.cognitoUserPoolId
  const clientId = config.public.cognitoClientId

  // Avoid blank screen in local dev when env vars are missing.
  if (!region || !userPoolId || !clientId) {
    // eslint-disable-next-line no-console
    console.warn(
      '[amplify] Missing Cognito config. Set NUXT_PUBLIC_AWS_REGION, NUXT_PUBLIC_COGNITO_USER_POOL_ID, NUXT_PUBLIC_COGNITO_CLIENT_ID.'
    )
    return {}
  }

  try {
    Amplify.configure({
      Auth: {
        Cognito: {
          userPoolId,
          userPoolClientId: clientId
        }
      }
    })
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[amplify] configure failed', e)
  }

  return {}
})

