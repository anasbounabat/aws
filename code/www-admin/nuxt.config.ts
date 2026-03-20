export default defineNuxtConfig({
  ssr: false,
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/tailwind.css'],
  app: {
    head: {
      titleTemplate: '%s · Console admin',
      title: 'Admin',
      meta: [
        { name: 'application-name', content: 'Console admin' },
        { name: 'description', content: 'Espace administrateur — connexion réservée aux comptes admin.' }
      ]
    }
  },
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787',
      cognitoUserPoolId: process.env.NUXT_PUBLIC_COGNITO_USER_POOL_ID || '',
      cognitoClientId: process.env.NUXT_PUBLIC_COGNITO_CLIENT_ID || '',
      awsRegion: process.env.NUXT_PUBLIC_AWS_REGION || ''
    }
  }
})

