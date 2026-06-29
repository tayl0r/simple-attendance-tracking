# Nanoid as primary key everywhere

We use 12-character nanoid strings as primary keys on all tables instead of UUIDs. The schedule ID is used directly in the shareable attendance URL (`/s/:id`), and a UUID would be too long to paste in a text message. Rather than maintain two ID systems (internal UUID + external slug), we use nanoid everywhere — it's short, URL-safe, and collision-resistant at this scale.

## Considered Options

- **UUID v4 + separate slug column on schedules** — standard pattern, but adds complexity with no benefit here
- **Auto-increment integer** — short but sequential and guessable, which undermines the URL-based access control
- **Nanoid everywhere** — chosen: single ID system, URL-friendly, practically unguessable
