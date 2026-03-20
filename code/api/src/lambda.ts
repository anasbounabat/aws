import { handle } from 'hono/aws-lambda'
import { app } from './app'

// AWS Lambda handler (API Gateway v2)
export const handler = handle(app)