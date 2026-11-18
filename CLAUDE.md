# Attendance Tracker — project instructions

## Branches & deployment

| Branch | Environment | URL | Deploy trigger |
|---|---|---|---|
| `main` | dev | https://attendance-dev.tsteil.com | push to `main` → `deploy.yml` builds `:dev` and deploys it |
| `prod` | production | https://attendance.tsteil.com | push to `prod` → `deploy.yml` builds `:prod` and deploys it |

**Deploys go only through the deploy gate.** The deploy job is `tayl0r/vps-deploy`,
pinned by full commit SHA. It logs in with the `VPS_*` secrets and can only redeploy
this app: the server picks the image from its own compose and the migration from the
vps app manifest, so never pass either from the workflow. Bump the pin only after
reading its diff, and never add another way of SSHing to the server. A failed deploy
says why in the job log's `VPS deploy` error, and on the gate's `deploy-gate:` line
when the gate ran. Exit 2 (refused) also pages Taylor as a possible leaked deploy key,
so find out why before re-running it.

## Local checks

**Local checks: `npm run verify`.** It runs the backend's build (`tsc`) and tests
(`vitest run`), then the frontend's build (`tsc && vite build`). Run it before calling
a PR ready: no workflow runs on pull requests. The deploy runs the same command before
it builds (plus a check that `.nvmrc` and the Dockerfile's `FROM node` share one Node
major), so a red check stops the deploy. Needs both packages' dependencies
installed: `npm ci --prefix backend && npm ci --prefix frontend`.

## Git workflow

**Feature work → `main`: squash-merge PRs.**
Each PR lands as one clean commit on `main`. `main` is the integration branch and
auto-deploys to dev.

**`prod` is fast-forward only.** Promote to prod with `git fetch origin && git push origin origin/main:prod`, which pushes `main` as GitHub has it, never a local `main` that may hold an unpushed commit. Never commit directly to `prod`, never open a PR with base `prod`, and never create a merge commit on it — every commit on `prod` must already be on `main` (`prod` is always an ancestor of `main`), so the promote fast-forwards it. GitHub's `prod` ruleset refuses a force push or a merge commit, but not a commit made directly on `prod`; the deploy workflow's on-main check refuses to deploy one (DEPLOY.md § Deploy key and secrets covers what it can't stop).

## Data safety

The Postgres database (`attendance` prod / `attendance_dev` dev on the shared
`apps-postgres-1`) is a separate service from the app container. Deploys only pull
a new app image and restart it — they never touch the database or its volume.
Migrations run on startup but are additive and tracked in `_migrations` (already-applied
migrations are skipped), so promoting code never overwrites rosters/schedules/attendance.

**Backups keep deleted data for up to 6 months.** This app's database is backed up hourly to the owner's Google Drive, encrypted, and kept for up to 6 months (vps `DEPLOY.md` § Backups). Anything user-facing that promises deletion (a privacy page, a delete-account flow, an email) must say that deleted data also leaves the backups within 6 months, never that no copy is kept.
