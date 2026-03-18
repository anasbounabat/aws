#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

say() { printf "\n==> %s\n" "$*"; }

ensure_dir() { mkdir -p "$1"; }

say "Creating folders"
ensure_dir "infrastructure"
ensure_dir "infrastructure/scripts"
ensure_dir "code/api/src"
ensure_dir "code/crons/src"
ensure_dir "code/domain/src"
ensure_dir "code/emails/templates"
ensure_dir "code/www-user"
ensure_dir "code/www-admin"
ensure_dir "code/www-assets"
ensure_dir "database/migrations"
ensure_dir "docker"

say "Creating base files (only if missing)"

if [[ ! -f ".gitlab-ci.yml" ]]; then
  cat > .gitlab-ci.yml <<'EOF'
stages:
  - install
  - lint
  - test
  - build

variables:
  NODE_ENV: "production"

install:
  stage: install
  image: oven/bun:1.2.7
  script:
    - bun --version
    - bun install

lint:
  stage: lint
  image: oven/bun:1.2.7
  script:
    - bun install
    - bun run lint || true

test:
  stage: test
  image: oven/bun:1.2.7
  script:
    - bun install
    - bun run test || true

build:
  stage: build
  image: oven/bun:1.2.7
  script:
    - bun install
    - bun run build
EOF
  echo "created: .gitlab-ci.yml"
fi

if [[ ! -f "docker/Dockerfile.bun" ]]; then
  cat > docker/Dockerfile.bun <<'EOF'
FROM oven/bun:1.2.7
WORKDIR /work
CMD ["bun", "--version"]
EOF
  echo "created: docker/Dockerfile.bun"
fi

if [[ ! -f "docker-compose.yml" ]]; then
  cat > docker-compose.yml <<'EOF'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: app
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  api:
    build:
      context: .
      dockerfile: docker/Dockerfile.bun
    working_dir: /work
    volumes:
      - ./:/work
    env_file:
      - .env
    environment:
      DATABASE_URL: postgres://app:app@postgres:5432/app
      PORT: "8787"
    depends_on:
      - postgres
    ports:
      - "8787:8787"
    command: ["bun", "run", "dev:api"]

volumes:
  pgdata:
EOF
  echo "created: docker-compose.yml"
fi

if [[ ! -f "infrastructure/scripts/migrate.ts" ]]; then
  cat > infrastructure/scripts/migrate.ts <<'EOF'
import fs from 'node:fs/promises'
import path from 'node:path'
import postgres from 'postgres'

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) throw new Error('DATABASE_URL is required')

const migrationsDir = path.resolve(process.cwd(), 'database/migrations')

async function listSqlFiles(dir: string) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  return entries
    .filter((e) => e.isFile() && e.name.endsWith('.sql'))
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b))
}

const sql = postgres(DATABASE_URL, { max: 1 })
try {
  const files = await listSqlFiles(migrationsDir)
  for (const file of files) {
    const fullPath = path.join(migrationsDir, file)
    const content = await fs.readFile(fullPath, 'utf8')
    console.log(`-> apply ${file}`)
    await sql.unsafe(content)
  }
  console.log('Migrations applied.')
} finally {
  await sql.end({ timeout: 5 })
}
EOF
  echo "created: infrastructure/scripts/migrate.ts"
fi

if [[ ! -f "code/emails/templates/team-invitation.html" ]]; then
  cat > code/emails/templates/team-invitation.html <<'EOF'
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Invitation à rejoindre une équipe</title>
  </head>
  <body style="margin:0;padding:0;background:#0F1C15;font-family:Inter,Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0F1C15;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;background:#F5F0E6;border-radius:18px;overflow:hidden;">
            <tr>
              <td style="padding:28px 28px 10px 28px;">
                <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:600;color:#0F1C15;line-height:1.1;">
                  Invitation à rejoindre {{team_name}}
                </div>
                <div style="margin-top:10px;color:rgba(15,28,21,0.72);font-size:14px;line-height:1.6;">
                  {{inviter_name}} vous a invité(e) à rejoindre l’équipe <strong>{{team_name}}</strong>.
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px 28px 28px;">
                <a href="{{accept_url}}" style="display:inline-block;background:#0F1C15;color:#F5F0E6;text-decoration:none;padding:12px 16px;border-radius:14px;font-weight:600;">
                  Accepter l’invitation
                </a>
                <a href="{{reject_url}}" style="display:inline-block;margin-left:10px;background:rgba(15,28,21,0.08);color:#0F1C15;text-decoration:none;padding:12px 16px;border-radius:14px;font-weight:600;">
                  Refuser
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
EOF
  echo "created: code/emails/templates/team-invitation.html"
fi

if [[ ! -f "database/migrations/001_init.sql" ]]; then
  cat > database/migrations/001_init.sql <<'EOF'
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
    CREATE TYPE task_status AS ENUM ('TODO', 'DOING', 'DONE');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS teams (
  id           BIGSERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  owner_sub    TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS memberships (
  team_id      BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_sub     TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (team_id, user_sub)
);

CREATE TABLE IF NOT EXISTS invitations (
  id            BIGSERIAL PRIMARY KEY,
  team_id       BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  invited_by_sub TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'PENDING',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS projects (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  team_id     BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
  id              BIGSERIAL PRIMARY KEY,
  title           TEXT NOT NULL,
  description     TEXT,
  status          task_status NOT NULL DEFAULT 'TODO',
  project_id      BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  assigned_to_sub TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assets (
  id          BIGSERIAL PRIMARY KEY,
  task_id     BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  s3_url      TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS backups (
  id          BIGSERIAL PRIMARY KEY,
  s3_url      TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
EOF
  echo "created: database/migrations/001_init.sql"
fi

chmod +x "$0" || true
say "Done."
echo "Next:"
echo "- Run: DATABASE_URL=... bun infrastructure/scripts/migrate.ts"
echo "- Run: bun run dev:api (requires bun installed)"

