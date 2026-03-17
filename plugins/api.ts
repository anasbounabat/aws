export default defineNuxtPlugin(() => {
  const token = useCookie<string | null>('token', { sameSite: 'lax' })

  const api = $fetch.create({
    baseURL: '/api',
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

