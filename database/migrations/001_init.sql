-- 001_init.sql
-- Base schema for the course spec:
-- - Users are stored in Cognito; DB stores only cognito_sub (string)
-- - No ORM

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
    CREATE TYPE task_status AS ENUM ('TODO', 'DOING', 'DONE');
  END IF;
END
$$;

-- Minimal app user table (Cognito is source of truth)
-- Stores only Cognito `sub` and app role
CREATE TABLE IF NOT EXISTS app_users (
  user_sub    TEXT PRIMARY KEY,
  role        TEXT NOT NULL DEFAULT 'user', -- admin/user
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
  status        TEXT NOT NULL DEFAULT 'PENDING', -- PENDING/ACCEPTED/REJECTED
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_team ON invitations(team_id);

CREATE TABLE IF NOT EXISTS projects (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
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

CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to_sub);

CREATE TABLE IF NOT EXISTS assets (
  id          BIGSERIAL PRIMARY KEY,
  task_id     BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  s3_url      TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assets_task_id ON assets(task_id);

CREATE TABLE IF NOT EXISTS backups (
  id          BIGSERIAL PRIMARY KEY,
  s3_url      TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

