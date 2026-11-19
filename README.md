# Attendance Tracker

A simple web app for tracking player attendance at youth soccer events — games and training sessions.

## Stack

- **Backend:** TypeScript, Fastify 4, PostgreSQL (node-postgres)
- **Frontend:** React 18, Vite 5, React Router 6
- **Deploy:** Single Docker container, GitHub Actions CI/CD

## Running locally

Needs pnpm: on the Node major `.nvmrc` names, `corepack enable` provides the version `package.json` pins.

```bash
# Start postgres
docker compose up postgres -d

# Dependencies, once, from the repo root: backend/ and frontend/ are one pnpm workspace
pnpm install

# Backend
cd backend && pnpm dev

# Frontend (separate terminal)
cd frontend && pnpm dev

# Checks, from the repo root
pnpm verify
```

Backend runs on `:3000`, frontend dev server proxies API calls.

## Environments

| Environment | URL | Branch |
|---|---|---|
| Production | https://attendance.tsteil.com | `prod` |
| Dev | https://attendance-dev.tsteil.com | `main` |

Pushing to `main` deploys dev; `git fetch origin && git push origin origin/main:refs/heads/prod` promotes it to production (CLAUDE.md § Git workflow).
Every deploy runs `pnpm verify` first, so a red check stops it (CLAUDE.md § Local checks).

## Error tracking

Both tiers report to GlitchTip (Sentry-compatible), separated by the `environment` tag (`production` / `development`):

- **Backend** reads its DSN from the `GLITCHTIP_DSN` env var (unset locally, so local errors aren't reported).
- **Frontend** reports client-side errors; its DSN is baked into the bundle (DSNs are send-only and safe to expose) and only initializes on the deployed hostnames.

## Domain language

See [CONTEXT.md](CONTEXT.md) for canonical terms (Event, Game, Training, Schedule, Roster, Player, Attendance).
