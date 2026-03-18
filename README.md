# Monorepo – Gestion de projet (Serverless AWS)

## Structure

- `code/api`: API REST (Hono + Bun) → Lambda
- `code/crons`: Cron backup hourly → Lambda (EventBridge)
- `code/domain`: logique métier + SQL brut (pas d’ORM)
- `code/emails`: templates SES (HTML)
- `code/www-assets`: assets statiques
- `code/www-user`: frontend Nuxt 3 (user)
- `code/www-admin`: frontend Nuxt 3 (admin)
- `database/migrations`: migrations SQL
- `infrastructure/scripts`: scripts migrations + deploy (AWS CLI)

## Local

1) Installer

```bash
npm i
```

2) Lancer la stack (Postgres + LocalStack + API)

```bash
docker compose up --build
```

3) Appliquer les migrations

```bash
DATABASE_URL="postgres://app:app@localhost:5432/app" bun infrastructure/scripts/migrate.ts
```

4) Lancer les apps (Turbo)

```bash
npm run dev
```

## Déploiement

Voir `infrastructure/scripts/` (STG/PRD).
