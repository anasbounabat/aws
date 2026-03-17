type Role = 'admin' | 'user'
export type AuthUser = { id: number; email: string; role: Role }

export function useAuth() {
  const token = useCookie<string | null>('token', { sameSite: 'lax' })
  const user = useState<AuthUser | null>('auth:user', () => null)
  const loading = useState<boolean>('auth:loading', () => false)

  const { $api } = useNuxtApp()

  async function loadMe() {
    if (!token.value) {
      user.value = null
      return null
    }
    loading.value = true
    try {
      const res = await $api<{ user: AuthUser }>('/auth/me')
      user.value = res.user
      return res.user
    } catch {
      token.value = null
      user.value = null
      return null
    } finally {
      loading.value = false
    }
  }

  async function login(email: string, password: string) {
    const res = await $api<{ token: string; user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: { email, password }
    })
    token.value = res.token
    user.value = res.user
    return res.user
  }

  async function register(email: string, password: string) {
    const res = await $api<{ token: string; user: AuthUser }>('/auth/register', {
      method: 'POST',
      body: { email, password }
    })
    token.value = res.token
    user.value = res.user
    return res.user
  }

  function logout() {
    token.value = null
    user.value = null
  }

  return { token, user, loading, loadMe, login, register, logout }
}

