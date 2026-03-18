import { serve } from '@hono/node-server'
import { app } from './app'
import { ENV } from './env'

serve({
  fetch: app.fetch,
  port: ENV.port
})

// eslint-disable-next-line no-console
console.log(`API listening on http://localhost:${ENV.port}`)

