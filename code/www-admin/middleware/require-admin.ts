export default defineNuxtRouteMiddleware(async () => {
  const auth = useAuth()
  const me = await auth.loadMe()
  if (!me || me.role !== 'admin') {
    return navigateTo('/login')
  }
})

