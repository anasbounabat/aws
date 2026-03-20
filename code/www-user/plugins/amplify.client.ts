import { Amplify } from 'aws-amplify'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const region = config.public.awsRegion || 'eu-north-1'
  const userPoolId = config.public.cognitoUserPoolId || 'eu-north-1_5Xu7e8HPN'
  const clientId = config.public.cognitoClientId || '73kgsif82avgb5h6me0p8d9pnc'

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
          userPoolClientId: clientId,
          region
        }
      }
    })
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[amplify] configure failed', e)
  }

  return {}
})

