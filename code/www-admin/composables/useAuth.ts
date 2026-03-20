import {
  fetchAuthSession,
  signIn,
  signOut,
  signUp,
  confirmSignUp,
  resendSignUpCode
} from '@aws-amplify/auth'

type Role = 'admin' | 'user'
export type Me = { sub: string; role: Role; email: string | null; name: string | null }

export function useAuth() {
  const appJwt = useCookie<string | null>('app_jwt', { sameSite: 'lax' })
  const me = useState<Me | null>('me', () => null)
  const loading = useState<boolean>('me:loading', () => false)

  const { $api } = useNuxtApp() as any

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

  function normalizeEmail(email: string) {
    return email.trim().toLowerCase()
  }

  function amplifyErrorMessage(e: any) {
    const name = e?.name || e?.__type
    const msg = e?.message || String(e)
    if (name === 'UserNotConfirmedException') {
      return 'Ton compte n’est pas confirmé. Va sur Register → entre ton email → confirme avec le code reçu.'
    }
    if (name === 'NotAuthorizedException') {
      return 'Email ou mot de passe incorrect.'
    }
    return msg
  }

  function isAlreadySignedInError(e: any) {
    const name = e?.name || e?.__type
    const msg = (e?.message || '').toLowerCase()
    return (
      name === 'UserAlreadyAuthenticatedException' ||
      (msg.includes('already') && msg.includes('signed in'))
    )
  }

  async function exchangeToken() {
    const session = await fetchAuthSession({ forceRefresh: true })
    const idToken = session.tokens?.idToken?.toString()
    if (!idToken) throw new Error('Missing Cognito idToken')

    const res = await $api<{ token: string }>('/auth/login', {
      method: 'POST',
      body: { idToken }
    })
    appJwt.value = res.token
    return res.token
  }

  async function loadMe(tokenOverride?: string) {
    let token = tokenOverride || appJwt.value
    if (!token) token = readCookieClient('app_jwt')
    if (!token) {
      me.value = null
      return null
    }
    token = String(token).replace(/^"|"$/g, '')
    loading.value = true
    try {
      const res = await $api<{ user: Me }>('/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      me.value = res.user
      return res.user
    } catch {
      me.value = null
      appJwt.value = null
      return null
    } finally {
      loading.value = false
    }
  }

  async function loginWithPassword(email: string, password: string) {
    try {
      await signIn({ username: normalizeEmail(email), password })
      const token = await exchangeToken()
      await loadMe(token)
    } catch (e: any) {
      if (isAlreadySignedInError(e)) {
        const token = await exchangeToken()
        await loadMe(token)
        return
      }
      throw new Error(amplifyErrorMessage(e))
    }
  }

  async function register(email: string, password: string) {
    const res = await signUp({ username: normalizeEmail(email), password })
    return { ok: true, nextStep: res.nextStep }
  }

  async function confirm(email: string, code: string) {
    await confirmSignUp({ username: normalizeEmail(email), confirmationCode: code })
    return { ok: true }
  }

  async function resend(email: string) {
    await resendSignUpCode({ username: normalizeEmail(email) })
    return { ok: true }
  }

  async function logout() {
    appJwt.value = null
    me.value = null
    await signOut()
  }

  return { appJwt, me, loading, loadMe, loginWithPassword, register, confirm, resend, logout }
}

