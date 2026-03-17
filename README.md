# Trello clone (Nuxt 3 + Nitro + PostgreSQL + AWS)

## Local setup

1. Install deps

```bash
npm i
```

2. Create a Postgres DB and run the schema

```bash
psql "$DATABASE_URL" -f db/schema.sql
```

3. Configure env

```bash
cp .env.example .env
```

4. Run dev

```bash
npm run dev
```

## Bun runtime (local / CI)

Ce projet fonctionne avec Node (par défaut ici) **et** Bun.

- Local (si Bun est installé):

```bash
bun install
bunx nuxt dev
```

Le backend Nitro (dossier `server/api`) est compatible Bun (pas d’APIs Node natives).

## Env vars (prod)

- `DATABASE_URL`: RDS Postgres connection string (prefer `sslmode=require`).
- `JWT_SECRET`: secret used to sign/verify JWT.
- `AWS_REGION`, `S3_BUCKET`: for S3 presigned URLs.
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`: optional locally; on Lambda use an IAM role.

## AWS deployment notes (Nitro aws-lambda)

- Nuxt generates a Lambda-ready bundle with `nitro.preset = 'aws-lambda'`.
- Put the Lambda behind API Gateway and CloudFront, and serve static assets via S3/CloudFront.
- Ensure the Lambda has network access to the RDS instance (VPC, SG rules) and a security group allowing Postgres (5432).

### Connecter Nitro (Lambda) à RDS PostgreSQL

- **VPC**: place la Lambda dans les subnets privés (ou publics avec NAT selon ton architecture).
- **Security Groups**:
  - SG Lambda → autorisé en **egress** vers le SG RDS.
  - SG RDS → **ingress 5432** depuis le SG Lambda (source = SG Lambda).
- **DATABASE_URL**: utilise l’endpoint RDS + `sslmode=require`.

### Front Admin: même build vs build séparé

Option A (simple, incluse): **même app** avec route `/admin` protégée par middleware (`middleware/admin.ts`) + endpoint `/api/admin/stats`.

Option B (séparé): **second frontend** (ex: `apps/admin/` avec son propre `nuxt.config.ts`) déployé à part (autre CloudFront origin / autre path) pour isoler UI/permissions.

# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
