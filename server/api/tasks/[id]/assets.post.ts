import { z } from 'zod'
import { db } from '../../../utils/db'
import { requireAuth } from '../../../utils/http'

const BodySchema = z.object({
  key: z.string().min(1).max(400)
})

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const taskId = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(taskId)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid task id' })
  }

  const body = BodySchema.parse(await readBody(event))
  const sql = db()

  const access = await sql<{ id: number }[]>`
    SELECT t.id
    FROM tasks t
    INNER JOIN projects p ON p.id = t.project_id
    INNER JOIN memberships m ON m.team_id = p.team_id
    WHERE t.id = ${taskId} AND m.user_id = ${auth.id}
    LIMIT 1
  `
  if (!access.length) {
    throw createError({ statusCode: 404, statusMessage: 'Task not found' })
  }

  const { s3Bucket } = useRuntimeConfig()
  if (!s3Bucket) {
    throw createError({ statusCode: 500, statusMessage: 'S3_BUCKET is not configured' })
  }

  const s3_url = `s3://${s3Bucket}/${body.key}`

  const asset = await sql<{ id: number; task_id: number; s3_url: string }[]>`
    INSERT INTO assets (task_id, s3_url)
    VALUES (${taskId}, ${s3_url})
    RETURNING id, task_id, s3_url
  `

  return { asset: asset[0]! }
})

