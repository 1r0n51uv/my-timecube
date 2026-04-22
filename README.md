# Agile Time Tracker

This project now follows a static frontend plus serverless backend pattern.

## Architecture

- The Vite app stays fully static.
- The frontend talks to async service modules in `src/lib/services`.
- Those services call a serverless API endpoint at `/.netlify/functions/api`.
- The serverless function owns all persistence and business logic.
- Prisma models live in `prisma/schema.prisma` and target PostgreSQL.
- Runtime data comes only from PostgreSQL through Prisma.

## Why this fits a static deploy

A static frontend cannot safely connect to PostgreSQL directly because credentials would be exposed in the browser. Putting Prisma and all database logic inside serverless functions gives you the backend separation you want while keeping the frontend deploy static.

## Data model

- `User`
- `Activity`
- `TimeEntry`

The function reads and writes users, activities, and monthly timesheet data in PostgreSQL.

## Environment

Copy `.env.example` to `.env` and set:

- `DATABASE_URL`
- `VITE_API_BASE_URL` if your serverless route is different

## Useful commands

- `npm run dev`
- `npm run dev:netlify`
- `npm run prisma:generate`
- `npm run prisma:migrate:dev`
- `npm run prisma:seed`
- `npm run build`

## Local development

Run `npm run dev` for a fully offline local setup. It starts:

- Vite on `http://localhost:8080`
- a local Node API on `http://localhost:8787`

Vite proxies `/api` to the local Prisma API, so login and all persistence work without Netlify or internet access.

If you keep `VITE_API_BASE_URL` in `.env` for production-style builds, local development will still use `/api` automatically. Only set `VITE_DEV_API_BASE_URL` if you want to override the local API base explicitly.

Use `npm run dev:netlify` only when you want to mimic the deployed Netlify runtime locally. Netlify documents that flow here: [Local development with Netlify CLI](https://docs.netlify.com/api-and-cli-guides/cli-guides/local-development/).

## Deployment note

This repository includes a `netlify.toml` and a Netlify function because that matches your original hosting target. If you deploy to another static host with serverless support, the same frontend service layer and Prisma schema can be reused with a different function adapter.
