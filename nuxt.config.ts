// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/tailwind.css'],
  app: {
    head: {
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;500;600&display=swap'
        }
      ]
    }
  },

  nitro: {
    preset: 'aws-lambda'
  },

  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresInSeconds: Number(process.env.JWT_EXPIRES_IN_SECONDS || 60 * 60 * 24 * 7),
    awsRegion: process.env.AWS_REGION,
    s3Bucket: process.env.S3_BUCKET,
    public: {
      appName: process.env.NUXT_PUBLIC_APP_NAME || 'Trello Clone'
    }
  }
})