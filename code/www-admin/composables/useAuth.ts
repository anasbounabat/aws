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

  async function exchangeToken() {
    const session = await fetchAuthSession()
    const idToken = session.tokens?.idToken?.toString()
    if (!idToken) throw new Error('Missing Cognito idToken')

    const res = await $api<{ token: string }>('/auth/login', {
      method: 'POST',
      body: { idToken }
    })
    appJwt.value = res.token
  }

  async function loadMe() {
    if (!appJwt.value) {
      me.value = null
      return null
    }
    loading.value = true
    try {
      const res = await $api<{ user: Me }>('/me')
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
    await signIn({ username: email, password })
    await exchangeToken()
    await loadMe()
  }

  async function register(email: string, password: string) {
    const res = await signUp({ username: email, password })
    return { ok: true, nextStep: res.nextStep }
  }

  async function confirm(email: string, code: string) {
    await confirmSignUp({ username: email, confirmationCode: code })
    return { ok: true }
  }

  async function resend(email: string) {
    await resendSignUpCode({ username: email })
    return { ok: true }
  }

  async function logout() {
    appJwt.value = null
    me.value = null
    await signOut()
  }

  return { appJwt, me, loading, loadMe, loginWithPassword, register, confirm, resend, logout }
}

