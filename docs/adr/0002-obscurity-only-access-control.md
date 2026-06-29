# Obscurity-only access control

There is no authentication. The admin routes (`/`, `/rosters`, `/schedules`) are unprotected but not linked from the shareable attendance page. The attendance tracker pages (`/s/:id`) use unguessable nanoid URLs for per-schedule isolation. This is a personal tool for a small group of trusted parents; the overhead of a login system isn't worth it. The admin URL is simply not shared.
