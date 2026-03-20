export default defineNuxtRouteMiddleware(async () => {
  const auth = useAuth()
  await auth.loadMe()
  if (auth.me.value) {
    return navigateTo('/dashboard')
  }
})

