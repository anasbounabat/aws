import { Amplify } from 'aws-amplify'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const userPoolId = config.public.cognitoUserPoolId
  const clientId = config.public.cognitoClientId

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId,
        userPoolClientId: clientId,
        // Email/password only (Google Hosted UI disabled by design)
      }
    }
  })
})

