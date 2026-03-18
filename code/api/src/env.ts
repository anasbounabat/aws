export function requireEnv(name: string) {
  const v = process.env[name]
  if (!v) throw new Error(`${name} is required`)
  return v
}

export const ENV = {
  port: Number(process.env.PORT || 8787),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  awsRegion: process.env.AWS_REGION,
  s3Bucket: process.env.S3_BUCKET,
  cognitoUserPoolId: process.env.COGNITO_USER_POOL_ID,
  cognitoClientId: process.env.COGNITO_CLIENT_ID,
  sesFromEmail: process.env.SES_FROM_EMAIL
}

