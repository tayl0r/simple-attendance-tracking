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

**Local checks: `pnpm verify`.** It runs every package's `build` script, then every
`test` script. Run it before calling a PR ready: no workflow runs on pull requests. The deploy runs the same
command before it builds, so a red check stops the deploy. Needs
`pnpm install --frozen-lockfile` first, as the deploy runs it, at the repo root:
backend/ and frontend/ are one pnpm workspace with one lockfile.

## Git workflow

**Feature work → `main`: squash-merge PRs.**
Each PR lands as one clean commit on `main`. `main` is the integration branch and
auto-deploys to dev.

**`prod` is fast-forward only.** Promote with `git fetch origin && git push origin origin/main:refs/heads/prod` (GitHub's `main`, never your local one). Push nothing else to `prod`: no direct commit, no force push, no PR with base `prod`, no merge commit on it. If a push to `prod` or a prod deploy is refused, stop and tell Taylor: rollbacks and the fix for a diverged `prod` are his call, even though your gh login can do them (vps's `DEPLOY.md` (tayl0r/vps) § GitHub repo settings (every repo)).

## Data safety

The Postgres database (`attendance` prod / `attendance_dev` dev on the shared
`apps-postgres-1`) is a separate service from the app container. Deploys only pull
a new app image and restart it — they never touch the database or its volume.
Migrations run on startup but are additive and tracked in `_migrations` (already-applied
migrations are skipped), so promoting code never overwrites rosters/schedules/attendance.

**Backups keep deleted data for up to 6 months.** This app's database is backed up hourly to the owner's Google Drive, encrypted, and kept for up to 6 months (vps `DEPLOY.md` § Backups). Anything user-facing that promises deletion (a privacy page, a delete-account flow, an email) must say that deleted data also leaves the backups within 6 months, never that no copy is kept.
