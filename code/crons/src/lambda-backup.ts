import { runBackup } from './backup'

// AWS Lambda handler for EventBridge schedule
export const handler = async () => {
  await runBackup()
  return { ok: true }
}

