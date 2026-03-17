export default defineNuxtRouteMiddleware(async () => {
  const auth = useAuth()
  if (auth.token.value && !auth.user.value) {
    await auth.loadMe()
  }
  if (!auth.token.value) {
    return navigateTo('/login')
  }
})

