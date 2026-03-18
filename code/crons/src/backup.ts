import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import postgres from 'postgres'

function requireEnv(name: string) {
  const v = process.env[name]
  if (!v) throw new Error(`${name} is required`)
  return v
}

function s3() {
  const region = requireEnv('AWS_REGION')
  const endpoint = process.env.AWS_ENDPOINT_URL
  return new S3Client({ region, endpoint: endpoint || undefined, forcePathStyle: !!endpoint })
}

export async function runBackup() {
  const databaseUrl = requireEnv('DATABASE_URL')
  const bucket = requireEnv('BACKUP_S3_BUCKET')

  const sql = postgres(databaseUrl, { max: 1 })
  try {
    // Minimal “backup”: export row counts as JSON (pg_dump is usually done in real infra)
    const [{ users }] = await sql<{ users: number }[]>`SELECT COUNT(*)::int AS users FROM users`
    const [{ teams }] = await sql<{ teams: number }[]>`SELECT COUNT(*)::int AS teams FROM teams`
    const [{ projects }] = await sql<{ projects: number }[]>`SELECT COUNT(*)::int AS projects FROM projects`
    const [{ tasks }] = await sql<{ tasks: number }[]>`SELECT COUNT(*)::int AS tasks FROM tasks`

    const ts = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `backup-${ts}.json`
    const key = `backups/${filename}`

    const body = JSON.stringify({ at: new Date().toISOString(), users, teams, projects, tasks }, null, 2)

    await s3().send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: 'application/json',
        Body: body
      })
    )

    const s3_url = `s3://${bucket}/${key}`
    await sql`INSERT INTO backups (s3_url) VALUES (${s3_url})`

    // eslint-disable-next-line no-console
    console.log(`backup stored: ${s3_url}`)
  } finally {
    await sql.end({ timeout: 5 })
  }
}

if (import.meta.main) await runBackup()

