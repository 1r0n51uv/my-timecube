FROM node:20-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json apps/backend/package.json

RUN pnpm install --filter @my-timecube/backend... --frozen-lockfile

COPY apps/backend ./apps/backend

RUN pnpm -C apps/backend prisma:generate
RUN pnpm -C apps/backend build

EXPOSE 3001

CMD ["sh", "-c", "pnpm -C apps/backend prisma:push && pnpm -C apps/backend prisma:seed && pnpm -C apps/backend start"]
