-- 002_users_team_members.sql
-- Align schema with spec naming:
-- - users: (id=cognito sub), role, created_at (no email)
-- - team_members: team_id, user_id, role, joined_at
-- Also keep backward-compat if 001 tables already exist.

CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,
  role        TEXT NOT NULL DEFAULT 'user', -- admin/user
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- migrate data from app_users -> users
INSERT INTO users (id, role, created_at)
SELECT user_sub, role, created_at
FROM app_users
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS team_members (
  team_id    BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'member', -- owner/member
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (team_id, user_id)
);

-- migrate data from memberships -> team_members (role defaults to member)
INSERT INTO team_members (team_id, user_id, role, joined_at)
SELECT team_id, user_sub, 'member', created_at
FROM memberships
ON CONFLICT (team_id, user_id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);

