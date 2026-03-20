import { useToast } from '../composables/useToast'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const token = useCookie<string | null>('app_jwt', { sameSite: 'lax' })
  const toast = useToast()

  function readCookieClient(name: string): string | null {
    if (typeof document === 'undefined') return null
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
    if (!match) return null
    try {
      return decodeURIComponent(match[1] ?? '')
    } catch {
      return match[1] ?? null
    }
  }

  const api = $fetch.create({
    baseURL: config.public.apiBaseUrl,
    onRequest({ options }) {
      // Nuxt's useCookie refs are not always in sync across composables/plugins.
      // Read the cookie directly on each request to guarantee Authorization is sent.
      const t = token.value ?? readCookieClient('app_jwt')
      if (t) {
        const raw = String(t).replace(/^"|"$/g, '')
        // Don't overwrite an explicit Authorization header.
        const headers: any = options.headers as any
        const hasAuthHeader =
          (headers && typeof headers === 'object' && typeof headers.Authorization === 'string') ||
          (typeof headers?.get === 'function' && typeof headers.get('Authorization') === 'string')

        if (hasAuthHeader) return

        // Some $fetch backends are picky about Headers instances; use a plain object.
        const existing = (() => {
          const h: any = options.headers
          if (!h) return {}
          if (typeof Headers !== 'undefined' && h instanceof Headers) return Object.fromEntries(h.entries())
          return h
        })()
        options.headers = {
          ...existing,
          Authorization: `Bearer ${raw}`
        }
      }
    }
    ,
    onResponseError({ response, error }) {
      const status = response?.status
      const msg =
        // Nuxt fetch error can have a `data` field depending on backend adapters.
        (error as any)?.data?.error ||
        (error as any)?.data?.message ||
        response?.statusText ||
        (error as any)?.message ||
        'Request failed'

      // Toast feedback (most useful for “it does nothing” complaints)
      toast.push({
        kind: status && status >= 500 ? 'error' : 'error',
        title: `API ${status ?? ''}`.trim(),
        message: msg
      })

      // eslint-disable-next-line no-console
      console.error('[api]', status, msg, error)
    }
  })

  return { provide: { api } }
})

