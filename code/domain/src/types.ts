export type Role = 'admin' | 'user'

export type JwtPayload = {
  sub: string
  role: Role
  exp: number
}

export type Team = { id: number; name: string; owner_sub: string }
export type Project = { id: number; name: string; team_id: number }
export type TaskStatus = 'TODO' | 'DOING' | 'DONE'
export type Task = {
  id: number
  title: string
  description: string | null
  status: TaskStatus
  project_id: number
  assigned_to_sub: string | null
}

