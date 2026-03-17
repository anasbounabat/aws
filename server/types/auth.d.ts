import type { AuthPayload } from '../utils/jwt'

declare module 'h3' {
  interface H3EventContext {
    auth?: AuthPayload
  }
}

export {}

