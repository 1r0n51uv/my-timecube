# Agile Time Tracker

This project now follows a static frontend plus serverless backend pattern.

## Architecture

- The Vite app stays fully static.
- The frontend talks to async service modules in `src/lib/services`.
- Those services call a serverless API endpoint at `/.netlify/functions/api`.
- The serverless function owns all persistence and business logic.
- Prisma models live in `prisma/schema.prisma` and target PostgreSQL.
- If the API is unavailable, the frontend falls back to `localStorage` so the app still works in local development.

## Why this fits a static deploy

A static frontend cannot safely connect to PostgreSQL directly because credentials would be exposed in the browser. Putting Prisma and all database logic inside serverless functions gives you the backend separation you want while keeping the frontend deploy static.

## Data model

- `User`
- `Activity`
- `TimeEntry`

The function upserts users on demand and stores monthly timesheet data in PostgreSQL.

## Environment

Copy `.env.example` to `.env` and set:

- `DATABASE_URL`
- `VITE_API_BASE_URL` if your serverless route is different
- `VITE_FORCE_LOCAL_API=true` if you want to bypass the API and stay local-only

## Useful commands

- `npm run prisma:generate`
- `npm run prisma:migrate:dev`
- `npm run prisma:seed`
- `npm run build`

## Deployment note

This repository includes a `netlify.toml` and a Netlify function because that matches your original hosting target. If you deploy to another static host with serverless support, the same frontend service layer and Prisma schema can be reused with a different function adapter.
