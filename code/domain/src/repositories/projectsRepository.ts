import { domainDb } from '../db'

export type ProjectRow = {
  id: number
  team_id: number
  name: string
  description: string | null
  created_at: string
}

export function projectsRepository() {
  const sql = domainDb()

  return {
    async create(input: { teamId: number; name: string; description?: string | null }) {
      const rows = await sql<ProjectRow[]>`
        INSERT INTO projects (team_id, name, description)
        VALUES (${input.teamId}, ${input.name}, ${input.description ?? null})
        RETURNING id, team_id, name, description, created_at
      `
      return rows[0]!
    },

    async getById(projectId: number) {
      const rows = await sql<ProjectRow[]>`
        SELECT id, team_id, name, description, created_at
        FROM projects
        WHERE id = ${projectId}
        LIMIT 1
      `
      return rows[0] ?? null
    },

    async listByTeam(teamId: number) {
      return await sql<ProjectRow[]>`
        SELECT id, team_id, name, description, created_at
        FROM projects
        WHERE team_id = ${teamId}
        ORDER BY id DESC
      `
    }
  }
}

