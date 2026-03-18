import postgres from 'postgres'

let sqlSingleton: ReturnType<typeof postgres> | null = null

export function domainDb() {
  if (sqlSingleton) return sqlSingleton
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is required')
  sqlSingleton = postgres(url, { max: 10, idle_timeout: 20, connect_timeout: 10 })
  return sqlSingleton
}

