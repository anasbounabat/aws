export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const token = useCookie<string | null>('app_jwt', { sameSite: 'lax' })

  const api = $fetch.create({
    baseURL: config.public.apiBaseUrl,
    onRequest({ options }) {
      const t = token.value
      if (t) {
        const headers = new Headers(options.headers as HeadersInit | undefined)
        headers.set('Authorization', `Bearer ${t}`)
        options.headers = headers
      }
    }
  })

  return { provide: { api } }
})

