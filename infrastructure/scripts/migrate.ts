import fs from 'node:fs/promises'
import path from 'node:path'
import postgres from 'postgres'

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is required')
}

const migrationsDir = path.resolve(process.cwd(), 'database/migrations')

async function listSqlFiles(dir: string) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  return entries
    .filter((e) => e.isFile() && e.name.endsWith('.sql'))
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b))
}

async function main() {
  const sql = postgres(DATABASE_URL, { max: 1 })
  try {
    const files = await listSqlFiles(migrationsDir)
    for (const file of files) {
      const fullPath = path.join(migrationsDir, file)
      const content = await fs.readFile(fullPath, 'utf8')
      // eslint-disable-next-line no-console
      console.log(`-> apply ${file}`)
      await sql.unsafe(content)
    }
    // eslint-disable-next-line no-console
    console.log('Migrations applied.')
  } finally {
    await sql.end({ timeout: 5 })
  }
}

await main()

