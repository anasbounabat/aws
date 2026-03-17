import postgres from 'postgres'

let sqlSingleton: ReturnType<typeof postgres> | null = null

export function db() {
  if (sqlSingleton) return sqlSingleton

  const config = useRuntimeConfig()
  if (!config.databaseUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: 'DATABASE_URL is not configured'
    })
  }

  sqlSingleton = postgres(config.databaseUrl, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10
  })

  return sqlSingleton
}

