import { z } from 'zod'
import { db } from '../../../../utils/db'
import { requireAuth } from '../../../../utils/http'
import { buildTaskAssetKey, presignPutObject } from '../../../../utils/s3'

const BodySchema = z.object({
  filename: z.string().min(1).max(200),
  contentType: z.string().min(1).max(200)
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

  const key = buildTaskAssetKey(taskId, body.filename)
  const { url } = await presignPutObject({ key, contentType: body.contentType, expiresInSeconds: 120 })
  return { url, key }
})

