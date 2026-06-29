# Attendance Tracker

A simple web app for tracking player attendance at youth soccer events — games and training sessions.

## Stack

- **Backend:** TypeScript, Fastify 4, PostgreSQL (node-postgres)
- **Frontend:** React 18, Vite 5, React Router 6
- **Deploy:** Single Docker container, GitHub Actions CI/CD

## Running locally

```bash
# Start postgres
docker compose up postgres -d

# Backend
cd backend && npm install && npm run dev

# Frontend (separate terminal)
cd frontend && npm install && npm run dev
```

Backend runs on `:3000`, frontend dev server proxies API calls.

## Environments

| Environment | URL | Branch |
|---|---|---|
| Production | https://attendance.tsteil.com | `main` |
| Dev | https://attendance-dev.tsteil.com | `dev` |

Push to either branch to trigger a deploy via GitHub Actions.

## Domain language

See [CONTEXT.md](CONTEXT.md) for canonical terms (Event, Game, Training, Schedule, Roster, Player, Attendance).
