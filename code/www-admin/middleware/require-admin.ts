export default defineNuxtRouteMiddleware(async () => {
  const auth = useAuth()
  if (auth.me.value?.role === 'admin') return

  const me = await auth.loadMe()
  if (!me || me.role !== 'admin') {
    return navigateTo('/login')
  }
})

