// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/tailwind.css'],

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