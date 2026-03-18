import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { verifyCognitoJwt } from './auth/cognito_jwt'
import { signAppJwt } from './auth/app_jwt'
import { requireAdmin, requireUser, type AppAuth } from './auth/app_middleware'
import { get_user_by_sub, update_user_by_sub } from './services/aws_cognito'
import { db } from './db'
import { makeAssetKey, presignUpload, s3UrlForKey, deleteObject } from './services/aws_s3'
import { sendInvitationEmail } from './services/aws_ses'

// NOTE: this is a scaffold. Next steps:
// - JWT middleware
// - Cognito service integration
// - Postgres queries (no ORM)
// - Implement full routes list

export const app = new Hono<{ Variables: { auth: AppAuth; sub: string } }>()

app.use('*', logger())
app.use(
  '*',
  cors({
    origin: '*',
    allowHeaders: ['Authorization', 'Content-Type'],
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS']
  })
)

app.get('/health', (c) => c.json({ ok: true }))

// Auth
app.post('/users', async (c) => {
  // With Cognito as source of truth, account creation happens in Cognito.
  // This endpoint can "provision" an app user row after the client has a valid Cognito token.
  const body = await c.req.json().catch(() => ({}))
  const token = typeof body?.idToken === 'string' ? body.idToken : null
  if (!token) return c.json({ error: 'idToken is required' }, 400)

  const verified = await verifyCognitoJwt(token)
  const sql = db()
  await sql`INSERT INTO users (id, role) VALUES (${verified.sub}, 'user') ON CONFLICT (id) DO NOTHING`
  return c.json({ ok: true })
})

app.post('/auth/login', async (c) => {
  // Exchange a valid Cognito token for an app JWT (HS256)
  const body = await c.req.json().catch(() => ({}))
  const token = typeof body?.idToken === 'string' ? body.idToken : null
  if (!token) return c.json({ error: 'idToken is required' }, 400)

  const verified = await verifyCognitoJwt(token)
  const sql = db()
  const rows = await sql<{ role: 'admin' | 'user' }[]>`SELECT role FROM users WHERE id = ${verified.sub} LIMIT 1`
  const role = rows[0]?.role ?? 'user'
  if (!rows.length) {
    await sql`INSERT INTO users (id, role) VALUES (${verified.sub}, ${role}) ON CONFLICT (id) DO NOTHING`
  }
  const jwt = await signAppJwt({ sub: verified.sub, role })
  return c.json({ token: jwt })
})

app.get('/me', requireUser, async (c) => {
  const auth = c.get('auth')
  const user = await get_user_by_sub(auth.sub)
  return c.json({ user: { ...user, role: auth.role, sub: auth.sub } })
})

app.patch('/me', requireUser, async (c) => {
  const auth = c.get('auth')
  const body = await c.req.json().catch(() => ({}))
  const name = typeof body?.name === 'string' ? body.name : undefined
  await update_user_by_sub(auth.sub, { name })
  const user = await get_user_by_sub(auth.sub)
  return c.json({ user: { ...user, role: auth.role, sub: auth.sub } })
})

// Teams / invitations / projects / tasks / assets / admin
app.post('/teams', requireUser, async (c) => {
  const auth = c.get('auth')
  const body = await c.req.json().catch(() => ({}))
  const name = typeof body?.name === 'string' && body.name.trim() ? body.name.trim() : null
  if (!name) return c.json({ error: 'name is required' }, 400)

  const sql = db()
  const rows = await sql<{ id: number; name: string; owner_sub: string }[]>`
    INSERT INTO teams (name, owner_sub) VALUES (${name}, ${auth.sub})
    RETURNING id, name, owner_sub
  `
  const team = rows[0]!
  await sql`
    INSERT INTO team_members (team_id, user_id, role)
    VALUES (${team.id}, ${auth.sub}, 'owner')
    ON CONFLICT (team_id, user_id) DO NOTHING
  `
  return c.json({ team })
})

app.get('/teams', requireUser, async (c) => {
  const auth = c.get('auth')
  const sql = db()
  const teams = await sql<{ id: number; name: string; owner_sub: string; created_at: string }[]>`
    SELECT t.id, t.name, t.owner_sub, t.created_at
    FROM teams t
    INNER JOIN team_members tm ON tm.team_id = t.id
    WHERE tm.user_id = ${auth.sub}
    ORDER BY t.id DESC
  `
  return c.json({ teams })
})

app.get('/teams/:teamId', requireUser, async (c) => {
  const auth = c.get('auth')
  const teamId = Number(c.req.param('teamId'))
  if (!Number.isFinite(teamId)) return c.json({ error: 'invalid teamId' }, 400)
  const sql = db()
  const member = await sql<{ ok: boolean }[]>`
    SELECT true AS ok FROM team_members WHERE team_id = ${teamId} AND user_id = ${auth.sub} LIMIT 1
  `
  if (!member.length) return c.json({ error: 'not found' }, 404)
  const team = await sql<{ id: number; name: string; owner_sub: string; created_at: string }[]>`
    SELECT id, name, owner_sub, created_at FROM teams WHERE id = ${teamId} LIMIT 1
  `
  return c.json({ team: team[0]! })
})

app.get('/teams/:teamId/members', requireUser, async (c) => {
  const auth = c.get('auth')
  const teamId = Number(c.req.param('teamId'))
  if (!Number.isFinite(teamId)) return c.json({ error: 'invalid teamId' }, 400)
  const sql = db()
  const member = await sql<{ ok: boolean }[]>`
    SELECT true AS ok FROM team_members WHERE team_id = ${teamId} AND user_id = ${auth.sub} LIMIT 1
  `
  if (!member.length) return c.json({ error: 'not found' }, 404)
  const rows = await sql<{ user_id: string; role: string; joined_at: string }[]>`
    SELECT user_id, role, joined_at FROM team_members WHERE team_id = ${teamId} ORDER BY joined_at ASC
  `
  // Enrich from Cognito (name/email) on demand
  const enriched = await Promise.all(
    rows.map(async (r) => {
      const u = await get_user_by_sub(r.user_id)
      return { ...r, ...u }
    })
  )
  return c.json({ members: enriched })
})

app.post('/teams/:teamId/invitations', requireUser, async (c) => {
  const auth = c.get('auth')
  const teamId = Number(c.req.param('teamId'))
  if (!Number.isFinite(teamId)) return c.json({ error: 'invalid teamId' }, 400)
  const body = await c.req.json().catch(() => ({}))
  const email = typeof body?.email === 'string' ? body.email.toLowerCase().trim() : null
  if (!email) return c.json({ error: 'email is required' }, 400)

  const sql = db()
  const isOwner = await sql<{ ok: boolean }[]>`
    SELECT true AS ok FROM team_members WHERE team_id = ${teamId} AND user_id = ${auth.sub} AND role = 'owner' LIMIT 1
  `
  if (!isOwner.length) return c.json({ error: 'forbidden' }, 403)

  const inv = await sql<{ id: number; team_id: number; email: string; status: string; created_at: string }[]>`
    INSERT INTO invitations (team_id, email, invited_by_sub, status)
    VALUES (${teamId}, ${email}, ${auth.sub}, 'PENDING')
    RETURNING id, team_id, email, status, created_at
  `

  const team = await sql<{ name: string }[]>`SELECT name FROM teams WHERE id = ${teamId} LIMIT 1`
  const inviter = await get_user_by_sub(auth.sub)
  const env = (globalThis as any).process?.env || {}
  const base = env.PUBLIC_APP_BASE_URL || 'http://localhost:3000'
  const acceptUrl = `${base}/invitations/${inv[0]!.id}/accept`
  const rejectUrl = `${base}/invitations/${inv[0]!.id}/reject`

  await sendInvitationEmail({
    to: email,
    teamName: team[0]?.name || 'Team',
    inviterName: inviter.name || inviter.email || 'Someone',
    acceptUrl,
    rejectUrl
  })

  return c.json({ invitation: inv[0]! })
})

app.get('/invitations', requireUser, async (c) => {
  const auth = c.get('auth')
  const me = await get_user_by_sub(auth.sub)
  const email = (me.email || '').toLowerCase()
  if (!email) return c.json({ invitations: [] })
  const sql = db()
  const invitations = await sql<{ id: number; team_id: number; email: string; status: string; created_at: string }[]>`
    SELECT id, team_id, email, status, created_at
    FROM invitations
    WHERE email = ${email} AND status = 'PENDING'
    ORDER BY id DESC
  `
  return c.json({ invitations })
})

app.post('/invitations/:invitationId/accept', requireUser, async (c) => {
  const auth = c.get('auth')
  const invitationId = Number(c.req.param('invitationId'))
  if (!Number.isFinite(invitationId)) return c.json({ error: 'invalid invitationId' }, 400)
  const me = await get_user_by_sub(auth.sub)
  const email = (me.email || '').toLowerCase()
  if (!email) return c.json({ error: 'email missing in cognito' }, 400)
  const sql = db()

  const inv = await sql<{ id: number; team_id: number; status: string }[]>`
    SELECT id, team_id, status
    FROM invitations
    WHERE id = ${invitationId} AND email = ${email}
    LIMIT 1
  `
  if (!inv.length) return c.json({ error: 'not found' }, 404)
  if (inv[0]!.status !== 'PENDING') return c.json({ error: 'already handled' }, 400)

  await sql`
    UPDATE invitations
    SET status = 'ACCEPTED', responded_at = NOW()
    WHERE id = ${invitationId}
  `
  await sql`
    INSERT INTO team_members (team_id, user_id, role)
    VALUES (${inv[0]!.team_id}, ${auth.sub}, 'member')
    ON CONFLICT (team_id, user_id) DO NOTHING
  `
  return c.json({ ok: true })
})

app.post('/invitations/:invitationId/reject', requireUser, async (c) => {
  const auth = c.get('auth')
  const invitationId = Number(c.req.param('invitationId'))
  if (!Number.isFinite(invitationId)) return c.json({ error: 'invalid invitationId' }, 400)
  const me = await get_user_by_sub(auth.sub)
  const email = (me.email || '').toLowerCase()
  if (!email) return c.json({ error: 'email missing in cognito' }, 400)
  const sql = db()

  const inv = await sql<{ id: number; status: string }[]>`
    SELECT id, status
    FROM invitations
    WHERE id = ${invitationId} AND email = ${email}
    LIMIT 1
  `
  if (!inv.length) return c.json({ error: 'not found' }, 404)
  if (inv[0]!.status !== 'PENDING') return c.json({ error: 'already handled' }, 400)

  await sql`
    UPDATE invitations
    SET status = 'REJECTED', responded_at = NOW()
    WHERE id = ${invitationId}
  `
  return c.json({ ok: true })
})

app.post('/teams/:teamId/projects', requireUser, async (c) => {
  const auth = c.get('auth')
  const teamId = Number(c.req.param('teamId'))
  if (!Number.isFinite(teamId)) return c.json({ error: 'invalid teamId' }, 400)
  const body = await c.req.json().catch(() => ({}))
  const name = typeof body?.name === 'string' && body.name.trim() ? body.name.trim() : null
  const description = typeof body?.description === 'string' ? body.description : null
  if (!name) return c.json({ error: 'name is required' }, 400)
  const sql = db()
  const member = await sql<{ ok: boolean }[]>`
    SELECT true AS ok FROM team_members WHERE team_id = ${teamId} AND user_id = ${auth.sub} LIMIT 1
  `
  if (!member.length) return c.json({ error: 'forbidden' }, 403)
  const rows = await sql<{ id: number; team_id: number; name: string; description: string | null; created_at: string }[]>`
    INSERT INTO projects (team_id, name, description)
    VALUES (${teamId}, ${name}, ${description})
    RETURNING id, team_id, name, description, created_at
  `
  return c.json({ project: rows[0]! })
})

app.get('/teams/:teamId/projects', requireUser, async (c) => {
  const auth = c.get('auth')
  const teamId = Number(c.req.param('teamId'))
  if (!Number.isFinite(teamId)) return c.json({ error: 'invalid teamId' }, 400)
  const sql = db()
  const member = await sql<{ ok: boolean }[]>`
    SELECT true AS ok FROM team_members WHERE team_id = ${teamId} AND user_id = ${auth.sub} LIMIT 1
  `
  if (!member.length) return c.json({ error: 'not found' }, 404)
  const projects = await sql<{ id: number; team_id: number; name: string; description: string | null; created_at: string }[]>`
    SELECT id, team_id, name, description, created_at
    FROM projects
    WHERE team_id = ${teamId}
    ORDER BY id DESC
  `
  return c.json({ projects })
})

app.get('/projects/:projectId', requireUser, async (c) => {
  const auth = c.get('auth')
  const projectId = Number(c.req.param('projectId'))
  if (!Number.isFinite(projectId)) return c.json({ error: 'invalid projectId' }, 400)
  const sql = db()
  const rows = await sql<{ id: number; team_id: number; name: string; description: string | null; created_at: string }[]>`
    SELECT id, team_id, name, description, created_at FROM projects WHERE id = ${projectId} LIMIT 1
  `
  if (!rows.length) return c.json({ error: 'not found' }, 404)
  const member = await sql<{ ok: boolean }[]>`
    SELECT true AS ok FROM team_members WHERE team_id = ${rows[0]!.team_id} AND user_id = ${auth.sub} LIMIT 1
  `
  if (!member.length) return c.json({ error: 'not found' }, 404)
  return c.json({ project: rows[0]! })
})

app.patch('/projects/:projectId', requireUser, async (c) => {
  const auth = c.get('auth')
  const projectId = Number(c.req.param('projectId'))
  if (!Number.isFinite(projectId)) return c.json({ error: 'invalid projectId' }, 400)
  const body = await c.req.json().catch(() => ({}))
  const name = typeof body?.name === 'string' ? body.name.trim() : undefined
  const description = typeof body?.description === 'string' ? body.description : undefined
  const sql = db()
  const rows = await sql<{ id: number; team_id: number }[]>`SELECT id, team_id FROM projects WHERE id = ${projectId} LIMIT 1`
  if (!rows.length) return c.json({ error: 'not found' }, 404)
  const member = await sql<{ ok: boolean }[]>`
    SELECT true AS ok FROM team_members WHERE team_id = ${rows[0]!.team_id} AND user_id = ${auth.sub} LIMIT 1
  `
  if (!member.length) return c.json({ error: 'forbidden' }, 403)
  const updated = await sql<{ id: number; team_id: number; name: string; description: string | null; created_at: string }[]>`
    UPDATE projects
    SET
      name = COALESCE(${name ?? null}, name),
      description = COALESCE(${description ?? null}, description)
    WHERE id = ${projectId}
    RETURNING id, team_id, name, description, created_at
  `
  return c.json({ project: updated[0]! })
})

app.delete('/projects/:projectId', requireUser, async (c) => {
  const auth = c.get('auth')
  const projectId = Number(c.req.param('projectId'))
  if (!Number.isFinite(projectId)) return c.json({ error: 'invalid projectId' }, 400)
  const sql = db()
  const rows = await sql<{ id: number; team_id: number }[]>`SELECT id, team_id FROM projects WHERE id = ${projectId} LIMIT 1`
  if (!rows.length) return c.json({ error: 'not found' }, 404)
  const member = await sql<{ ok: boolean }[]>`
    SELECT true AS ok FROM team_members WHERE team_id = ${rows[0]!.team_id} AND user_id = ${auth.sub} LIMIT 1
  `
  if (!member.length) return c.json({ error: 'forbidden' }, 403)
  await sql`DELETE FROM projects WHERE id = ${projectId}`
  return c.json({ ok: true })
})

app.post('/projects/:projectId/tasks', requireUser, async (c) => {
  const auth = c.get('auth')
  const projectId = Number(c.req.param('projectId'))
  if (!Number.isFinite(projectId)) return c.json({ error: 'invalid projectId' }, 400)
  const body = await c.req.json().catch(() => ({}))
  const title = typeof body?.title === 'string' && body.title.trim() ? body.title.trim() : null
  const description = typeof body?.description === 'string' ? body.description : null
  if (!title) return c.json({ error: 'title is required' }, 400)
  const sql = db()
  const p = await sql<{ team_id: number }[]>`SELECT team_id FROM projects WHERE id = ${projectId} LIMIT 1`
  if (!p.length) return c.json({ error: 'not found' }, 404)
  const member = await sql<{ ok: boolean }[]>`
    SELECT true AS ok FROM team_members WHERE team_id = ${p[0]!.team_id} AND user_id = ${auth.sub} LIMIT 1
  `
  if (!member.length) return c.json({ error: 'forbidden' }, 403)
  const rows = await sql<{ id: number; project_id: number; title: string; description: string | null; status: string; assigned_to_sub: string | null; created_at: string }[]>`
    INSERT INTO tasks (project_id, title, description, status, assigned_to_sub)
    VALUES (${projectId}, ${title}, ${description}, 'TODO', NULL)
    RETURNING id, project_id, title, description, status, assigned_to_sub, created_at
  `
  return c.json({ task: rows[0]! })
})

app.get('/projects/:projectId/tasks', requireUser, async (c) => {
  const auth = c.get('auth')
  const projectId = Number(c.req.param('projectId'))
  if (!Number.isFinite(projectId)) return c.json({ error: 'invalid projectId' }, 400)
  const sql = db()
  const p = await sql<{ team_id: number }[]>`SELECT team_id FROM projects WHERE id = ${projectId} LIMIT 1`
  if (!p.length) return c.json({ error: 'not found' }, 404)
  const member = await sql<{ ok: boolean }[]>`
    SELECT true AS ok FROM team_members WHERE team_id = ${p[0]!.team_id} AND user_id = ${auth.sub} LIMIT 1
  `
  if (!member.length) return c.json({ error: 'forbidden' }, 403)
  const tasks = await sql<{ id: number; project_id: number; title: string; description: string | null; status: string; assigned_to_sub: string | null; created_at: string }[]>`
    SELECT id, project_id, title, description, status, assigned_to_sub, created_at
    FROM tasks WHERE project_id = ${projectId} ORDER BY id DESC
  `
  return c.json({ tasks })
})

app.get('/tasks/:taskId', requireUser, async (c) => {
  const auth = c.get('auth')
  const taskId = Number(c.req.param('taskId'))
  if (!Number.isFinite(taskId)) return c.json({ error: 'invalid taskId' }, 400)
  const sql = db()
  const rows = await sql<{ id: number; project_id: number; title: string; description: string | null; status: string; assigned_to_sub: string | null; created_at: string }[]>`
    SELECT id, project_id, title, description, status, assigned_to_sub, created_at FROM tasks WHERE id = ${taskId} LIMIT 1
  `
  if (!rows.length) return c.json({ error: 'not found' }, 404)
  const team = await sql<{ team_id: number }[]>`
    SELECT p.team_id FROM projects p INNER JOIN tasks t ON t.project_id = p.id WHERE t.id = ${taskId} LIMIT 1
  `
  const member = await sql<{ ok: boolean }[]>`
    SELECT true AS ok FROM team_members WHERE team_id = ${team[0]!.team_id} AND user_id = ${auth.sub} LIMIT 1
  `
  if (!member.length) return c.json({ error: 'not found' }, 404)
  return c.json({ task: rows[0]! })
})

app.patch('/tasks/:taskId', requireUser, async (c) => {
  const auth = c.get('auth')
  const taskId = Number(c.req.param('taskId'))
  if (!Number.isFinite(taskId)) return c.json({ error: 'invalid taskId' }, 400)
  const body = await c.req.json().catch(() => ({}))
  const title = typeof body?.title === 'string' ? body.title.trim() : undefined
  const description = typeof body?.description === 'string' ? body.description : undefined
  const sql = db()
  const team = await sql<{ team_id: number }[]>`
    SELECT p.team_id FROM projects p INNER JOIN tasks t ON t.project_id = p.id WHERE t.id = ${taskId} LIMIT 1
  `
  if (!team.length) return c.json({ error: 'not found' }, 404)
  const member = await sql<{ ok: boolean }[]>`
    SELECT true AS ok FROM team_members WHERE team_id = ${team[0]!.team_id} AND user_id = ${auth.sub} LIMIT 1
  `
  if (!member.length) return c.json({ error: 'forbidden' }, 403)
  const updated = await sql<{ id: number; project_id: number; title: string; description: string | null; status: string; assigned_to_sub: string | null }[]>`
    UPDATE tasks
    SET
      title = COALESCE(${title ?? null}, title),
      description = COALESCE(${description ?? null}, description),
      updated_at = NOW()
    WHERE id = ${taskId}
    RETURNING id, project_id, title, description, status, assigned_to_sub
  `
  return c.json({ task: updated[0]! })
})

app.delete('/tasks/:taskId', requireUser, async (c) => {
  const auth = c.get('auth')
  const taskId = Number(c.req.param('taskId'))
  if (!Number.isFinite(taskId)) return c.json({ error: 'invalid taskId' }, 400)
  const sql = db()
  const team = await sql<{ team_id: number }[]>`
    SELECT p.team_id FROM projects p INNER JOIN tasks t ON t.project_id = p.id WHERE t.id = ${taskId} LIMIT 1
  `
  if (!team.length) return c.json({ error: 'not found' }, 404)
  const member = await sql<{ ok: boolean }[]>`
    SELECT true AS ok FROM team_members WHERE team_id = ${team[0]!.team_id} AND user_id = ${auth.sub} LIMIT 1
  `
  if (!member.length) return c.json({ error: 'forbidden' }, 403)
  await sql`DELETE FROM tasks WHERE id = ${taskId}`
  return c.json({ ok: true })
})

app.patch('/tasks/:taskId/assign', requireUser, async (c) => {
  const auth = c.get('auth')
  const taskId = Number(c.req.param('taskId'))
  if (!Number.isFinite(taskId)) return c.json({ error: 'invalid taskId' }, 400)
  const body = await c.req.json().catch(() => ({}))
  const userSub = typeof body?.userSub === 'string' ? body.userSub : null
  if (!userSub) return c.json({ error: 'userSub is required' }, 400)
  const sql = db()
  const team = await sql<{ team_id: number }[]>`
    SELECT p.team_id FROM projects p INNER JOIN tasks t ON t.project_id = p.id WHERE t.id = ${taskId} LIMIT 1
  `
  if (!team.length) return c.json({ error: 'not found' }, 404)
  const member = await sql<{ ok: boolean }[]>`
    SELECT true AS ok FROM team_members WHERE team_id = ${team[0]!.team_id} AND user_id = ${auth.sub} LIMIT 1
  `
  if (!member.length) return c.json({ error: 'forbidden' }, 403)
  const isTeamMember = await sql<{ ok: boolean }[]>`
    SELECT true AS ok FROM team_members WHERE team_id = ${team[0]!.team_id} AND user_id = ${userSub} LIMIT 1
  `
  if (!isTeamMember.length) return c.json({ error: 'assignee not in team' }, 400)
  const updated = await sql<{ id: number; assigned_to_sub: string | null }[]>`
    UPDATE tasks SET assigned_to_sub = ${userSub}, updated_at = NOW()
    WHERE id = ${taskId}
    RETURNING id, assigned_to_sub
  `
  return c.json({ task: updated[0]! })
})

app.patch('/tasks/:taskId/status', requireUser, async (c) => {
  const auth = c.get('auth')
  const taskId = Number(c.req.param('taskId'))
  if (!Number.isFinite(taskId)) return c.json({ error: 'invalid taskId' }, 400)
  const body = await c.req.json().catch(() => ({}))
  const status = typeof body?.status === 'string' ? body.status : null
  if (status !== 'TODO' && status !== 'DOING' && status !== 'DONE') return c.json({ error: 'invalid status' }, 400)
  const sql = db()
  const team = await sql<{ team_id: number }[]>`
    SELECT p.team_id FROM projects p INNER JOIN tasks t ON t.project_id = p.id WHERE t.id = ${taskId} LIMIT 1
  `
  if (!team.length) return c.json({ error: 'not found' }, 404)
  const member = await sql<{ ok: boolean }[]>`
    SELECT true AS ok FROM team_members WHERE team_id = ${team[0]!.team_id} AND user_id = ${auth.sub} LIMIT 1
  `
  if (!member.length) return c.json({ error: 'forbidden' }, 403)
  const updated = await sql<{ id: number; status: string }[]>`
    UPDATE tasks SET status = ${status}::task_status, updated_at = NOW()
    WHERE id = ${taskId}
    RETURNING id, status
  `
  return c.json({ task: updated[0]! })
})

app.post('/tasks/:taskId/assets', requireUser, async (c) => {
  const auth = c.get('auth')
  const taskId = Number(c.req.param('taskId'))
  if (!Number.isFinite(taskId)) return c.json({ error: 'invalid taskId' }, 400)
  const body = await c.req.json().catch(() => ({}))
  const filename = typeof body?.filename === 'string' ? body.filename : null
  const contentType = typeof body?.contentType === 'string' ? body.contentType : 'application/octet-stream'
  if (!filename) return c.json({ error: 'filename is required' }, 400)
  const sql = db()
  const team = await sql<{ team_id: number }[]>`
    SELECT p.team_id FROM projects p INNER JOIN tasks t ON t.project_id = p.id WHERE t.id = ${taskId} LIMIT 1
  `
  if (!team.length) return c.json({ error: 'not found' }, 404)
  const member = await sql<{ ok: boolean }[]>`
    SELECT true AS ok FROM team_members WHERE team_id = ${team[0]!.team_id} AND user_id = ${auth.sub} LIMIT 1
  `
  if (!member.length) return c.json({ error: 'forbidden' }, 403)

  const key = makeAssetKey(taskId, filename)
  const { url } = await presignUpload({ key, contentType })
  const s3_url = s3UrlForKey(key)
  const asset = await sql<{ id: number; task_id: number; s3_url: string; created_at: string }[]>`
    INSERT INTO assets (task_id, s3_url)
    VALUES (${taskId}, ${s3_url})
    RETURNING id, task_id, s3_url, created_at
  `
  return c.json({ uploadUrl: url, asset: asset[0]!, key })
})

app.get('/tasks/:taskId/assets', requireUser, async (c) => {
  const auth = c.get('auth')
  const taskId = Number(c.req.param('taskId'))
  if (!Number.isFinite(taskId)) return c.json({ error: 'invalid taskId' }, 400)
  const sql = db()
  const team = await sql<{ team_id: number }[]>`
    SELECT p.team_id FROM projects p INNER JOIN tasks t ON t.project_id = p.id WHERE t.id = ${taskId} LIMIT 1
  `
  if (!team.length) return c.json({ error: 'not found' }, 404)
  const member = await sql<{ ok: boolean }[]>`
    SELECT true AS ok FROM team_members WHERE team_id = ${team[0]!.team_id} AND user_id = ${auth.sub} LIMIT 1
  `
  if (!member.length) return c.json({ error: 'forbidden' }, 403)
  const assets = await sql<{ id: number; task_id: number; s3_url: string; created_at: string }[]>`
    SELECT id, task_id, s3_url, created_at FROM assets WHERE task_id = ${taskId} ORDER BY id DESC
  `
  return c.json({ assets })
})

app.delete('/assets/:assetId', requireUser, async (c) => {
  const auth = c.get('auth')
  const assetId = Number(c.req.param('assetId'))
  if (!Number.isFinite(assetId)) return c.json({ error: 'invalid assetId' }, 400)
  const sql = db()
  const rows = await sql<{ id: number; s3_url: string; task_id: number }[]>`
    SELECT id, s3_url, task_id FROM assets WHERE id = ${assetId} LIMIT 1
  `
  if (!rows.length) return c.json({ error: 'not found' }, 404)
  const team = await sql<{ team_id: number }[]>`
    SELECT p.team_id
    FROM projects p
    INNER JOIN tasks t ON t.project_id = p.id
    WHERE t.id = ${rows[0]!.task_id}
    LIMIT 1
  `
  const member = await sql<{ ok: boolean }[]>`
    SELECT true AS ok FROM team_members WHERE team_id = ${team[0]!.team_id} AND user_id = ${auth.sub} LIMIT 1
  `
  if (!member.length) return c.json({ error: 'forbidden' }, 403)

  const env = (globalThis as any).process?.env || {}
  const prefix = `s3://${env.S3_BUCKET || ''}/`
  const key = rows[0]!.s3_url.startsWith(prefix) ? rows[0]!.s3_url.slice(prefix.length) : null
  if (key) await deleteObject(key)

  await sql`DELETE FROM assets WHERE id = ${assetId}`
  return c.json({ ok: true })
})

app.get('/admin/stats', requireAdmin, async (c) => {
  const sql = db()
  const [{ count: users }] = await sql<{ count: number }[]>`SELECT COUNT(*)::int AS count FROM users`
  const [{ count: teams }] = await sql<{ count: number }[]>`SELECT COUNT(*)::int AS count FROM teams`
  const [{ count: projects }] = await sql<{ count: number }[]>`SELECT COUNT(*)::int AS count FROM projects`
  const [{ count: tasks }] = await sql<{ count: number }[]>`SELECT COUNT(*)::int AS count FROM tasks`
  return c.json({ users, teams, projects, tasks })
})

app.get('/admin/users', requireAdmin, async (c) => {
  const sql = db()
  const rows = await sql<{ id: string; role: string; created_at: string }[]>`
    SELECT id, role, created_at FROM users ORDER BY created_at DESC
  `
  const enriched = await Promise.all(
    rows.map(async (r) => {
      const u = await get_user_by_sub(r.id)
      return { ...r, ...u }
    })
  )
  return c.json({ users: enriched })
})

app.get('/admin/backups', requireAdmin, async (c) => {
  const sql = db()
  const backups = await sql<{ id: number; s3_url: string; created_at: string }[]>`
    SELECT id, s3_url, created_at FROM backups ORDER BY id DESC
  `
  return c.json({ backups })
})

