import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { nanoid } from 'nanoid'

function client() {
  const region = process.env.AWS_REGION
  if (!region) throw new Error('AWS_REGION is required')
  const endpoint = process.env.AWS_ENDPOINT_URL
  return new S3Client({ region, endpoint: endpoint || undefined, forcePathStyle: !!endpoint })
}

function assetsBucket() {
  const b = process.env.S3_BUCKET
  if (!b) throw new Error('S3_BUCKET is required')
  return b
}

export function makeAssetKey(taskId: number, filename: string) {
  const safe = filename.replace(/[^\w.\-]+/g, '_').slice(0, 120) || 'file'
  return `tasks/${taskId}/${nanoid()}-${safe}`
}

export async function presignUpload(params: { key: string; contentType: string; expiresInSeconds?: number }) {
  const cmd = new PutObjectCommand({
    Bucket: assetsBucket(),
    Key: params.key,
    ContentType: params.contentType
  })
  const url = await getSignedUrl(client(), cmd, { expiresIn: params.expiresInSeconds ?? 120 })
  return { url }
}

export async function deleteObject(key: string) {
  await client().send(new DeleteObjectCommand({ Bucket: assetsBucket(), Key: key }))
  return { ok: true }
}

export function s3UrlForKey(key: string) {
  return `s3://${assetsBucket()}/${key}`
}

