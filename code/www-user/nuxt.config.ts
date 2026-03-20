export default defineNuxtConfig({
  ssr: false,
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/tailwind.css'],
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'https://i2ljfy4dec.execute-api.us-east-1.amazonaws.com',
      cognitoUserPoolId:
        process.env.NUXT_PUBLIC_COGNITO_USER_POOL_ID ||
        process.env.COGNITO_USER_POOL_ID ||
        'eu-north-1_5Xu7e8HPN',
      cognitoClientId:
        process.env.NUXT_PUBLIC_COGNITO_CLIENT_ID ||
        process.env.COGNITO_CLIENT_ID ||
        '73kgsif82avgb5h6me0p8d9pnc',
      awsRegion: process.env.NUXT_PUBLIC_AWS_REGION || process.env.AWS_REGION || 'eu-north-1'
    }
  }
})

