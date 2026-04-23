# My Timecube

Monorepo with:

- `apps/frontend`: Vite + React frontend
- `apps/backend`: Express + Prisma + PostgreSQL backend

## Environment

Create these files before running locally:

- `apps/backend/.env`
- `apps/frontend/.env`

Examples are provided in each app directory.

## Commands

- `pnpm install`
- `pnpm -C apps/backend prisma:push`
- `pnpm -C apps/backend prisma:seed`
- `pnpm run prisma:generate`
- `pnpm run generate:client`
- `pnpm run dev`
- `pnpm run build`

## Docker

The repository includes:

- `apps/backend/Dockerfile`
- `apps/frontend/Dockerfile`
- `docker-compose.yml`

Start the full stack with:

- `docker compose up --build`

To override deployment-specific settings, create a root `.env` file next to `docker-compose.yml`.
Example:

```env
CORS_ORIGIN=http://35.152.52.18:8080
VITE_API_BASE_URL=/
```

Services:

- Frontend: `http://localhost:8080`
- Backend: `http://localhost:3001`
- PostgreSQL: `localhost:5433`

Notes:

- The backend waits for PostgreSQL through Compose health checks.
- On container startup the backend runs `prisma db push`, seeds the database, and then starts the server.
- The frontend is built with `VITE_API_BASE_URL=/` and Nginx proxies `/api`, `/health`, and `/openapi.json` to the backend container.
- `CORS_ORIGIN` can be a comma-separated list, so you can allow both local and deployed frontends, for example `http://localhost:8080,http://35.152.52.18:8080`.
