export function requireAuth(event: H3Event) {
  const auth = event.context.auth
  if (!auth) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  return auth
}

export function requireAdmin(event: H3Event) {
  const auth = requireAuth(event)
  if (auth.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
  return auth
}

