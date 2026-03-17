import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { nanoid } from 'nanoid'

let s3Singleton: S3Client | null = null

function s3() {
  if (s3Singleton) return s3Singleton
  const config = useRuntimeConfig()
  if (!config.awsRegion) {
    throw createError({ statusCode: 500, statusMessage: 'AWS_REGION is not configured' })
  }
  s3Singleton = new S3Client({ region: config.awsRegion })
  return s3Singleton
}

export function buildTaskAssetKey(taskId: number, filename: string) {
  const safe = filename.replace(/[^\w.\-]+/g, '_').slice(0, 120) || 'file'
  return `tasks/${taskId}/${nanoid()}-${safe}`
}

export async function presignPutObject(params: {
  key: string
  contentType: string
  expiresInSeconds?: number
}) {
  const config = useRuntimeConfig()
  if (!config.s3Bucket) {
    throw createError({ statusCode: 500, statusMessage: 'S3_BUCKET is not configured' })
  }

  const cmd = new PutObjectCommand({
    Bucket: config.s3Bucket,
    Key: params.key,
    ContentType: params.contentType
  })

  const url = await getSignedUrl(s3(), cmd, {
    expiresIn: params.expiresInSeconds ?? 60
  })

  return { url }
}

