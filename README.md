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
| Production | https://attendance.tsteil.com | `prod` |
| Dev | https://attendance-dev.tsteil.com | `main` |

Push to either branch to trigger a deploy via GitHub Actions.

## Error tracking

Both tiers report to GlitchTip (Sentry-compatible), separated by the `environment` tag (`production` / `development`):

- **Backend** reads its DSN from the `GLITCHTIP_DSN` env var (unset locally, so local errors aren't reported).
- **Frontend** reports client-side errors; its DSN is baked into the bundle (DSNs are send-only and safe to expose) and only initializes on the deployed hostnames.

## Domain language

See [CONTEXT.md](CONTEXT.md) for canonical terms (Event, Game, Training, Schedule, Roster, Player, Attendance).
