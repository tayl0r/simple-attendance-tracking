# Attendance Tracker — project instructions

## Branches & deployment

| Branch | Environment | URL | Deploy trigger |
|---|---|---|---|
| `main` | dev | https://attendance-dev.tsteil.com | push to `main` → `deploy-dev.yml` builds `:dev` |
| `prod` | production | https://attendance.tsteil.com | push to `prod` → `deploy.yml` builds `:prod` |

## Git workflow

**Feature work → `main`: squash-merge PRs.**
Each PR lands as one clean commit on `main`. `main` is the integration branch and
auto-deploys to dev.

**Promotion `main` → `prod`: fast-forward push only.**
```bash
git push origin main:prod
```
This advances `prod` to main's exact commit (same SHA), so `prod` stays a strict
prefix of `main` and is always fast-forwardable.

**The invariant that keeps FF working:** `prod` must never receive a commit that
isn't already on `main`.
- Never commit directly to `prod`.
- Never merge a PR *into* `prod` — every GitHub PR merge type (merge commit,
  squash, rebase) creates a new commit on `prod` and re-diverges it, breaking the
  fast-forward. Do review gating on `main` *before* promoting, not as a PR into prod.

**If `prod` ever diverges** (someone PR-merged or committed to it directly), reset
it back to main — safe whenever prod carries no unique *content*, only stray commits:
```bash
git push --force-with-lease=prod origin main:prod
```

## Data safety

The Postgres database (`attendance` prod / `attendance_dev` dev on the shared
`apps-postgres-1`) is a separate service from the app container. Deploys only pull
a new app image and restart it — they never touch the database or its volume.
Migrations run on startup but are additive and tracked in `_migrations` (already-applied
migrations are skipped), so promoting code never overwrites rosters/schedules/attendance.
