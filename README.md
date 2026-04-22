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
