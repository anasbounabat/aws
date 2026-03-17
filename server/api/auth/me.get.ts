import { requireAuth } from '../../utils/http'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  return { user: auth }
})

