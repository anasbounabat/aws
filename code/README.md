# Monorepo structure (course-like)

- `code/api`: REST API (Hono + Bun) – AWS Lambda target
- `code/crons`: scheduled jobs (Bun) – AWS Lambda target
- `code/domain`: shared business logic (no infra)
- `code/emails`: email templates + rendering helpers
- `code/www-assets`: static assets project (optional)
- `code/www-user`: user frontend
- `code/www-admin`: admin frontend

This repository currently contains a Nuxt app at the root (legacy). The next step is to migrate it into `code/www-user` and create `code/www-admin` as a separate frontend.

