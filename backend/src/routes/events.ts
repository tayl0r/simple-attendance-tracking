import { FastifyPluginCallback } from 'fastify'
import { pool } from '../db'

// Single source of truth for the lock window. Event is editable until 30 minutes
// after its scheduled start time (in Pacific time). Both the event-update and
// attendance-upsert handlers enforce the same window via this constant.
const LOCK_CONDITION = `(date::text || 'T' || time::text)::timestamp AT TIME ZONE 'America/Los_Angeles' + interval '30 minutes' > now()`

const events: FastifyPluginCallback = (fastify, _opts, done) => {
  // Update event (type is not updatable)
  fastify.put<{
    Params: { id: string }
    Body: {
      date: string
      time: string
      location: string
      week?: number | null
      home_team?: string | null
      away_team?: string | null
      team?: string | null
    }
  }>('/events/:id', async (req, reply) => {
    // Check lock and fetch type in one query
    const { rows: [lockedEvent] } = await pool.query(
      `SELECT type FROM events
       WHERE id = $1
         AND ${LOCK_CONDITION}`,
      [req.params.id]
    )
    if (!lockedEvent) return reply.code(409).send({ error: 'Event is locked or not found' })
    const eventType = lockedEvent.type

    const { date, time, location, week, home_team, away_team, team } = req.body

    // Null out type-specific fields based on type
    const effectiveWeek = eventType === 'game' ? (week ?? null) : null
    const effectiveHomeTeam = eventType === 'game' ? (home_team ?? null) : null
    const effectiveAwayTeam = eventType === 'game' ? (away_team ?? null) : null
    const effectiveTeam = eventType === 'training' ? (team ?? null) : null

    const { rows: [row] } = await pool.query(
      `UPDATE events
       SET date = $1, time = $2, location = $3,
           week = $4, home_team = $5, away_team = $6, team = $7
       WHERE id = $8
       RETURNING id, schedule_id, type, date::text, time::text,
                 location, week, home_team, away_team, team`,
      [date, time, location,
       effectiveWeek, effectiveHomeTeam, effectiveAwayTeam, effectiveTeam,
       req.params.id]
    )
    return row
  })

  // Get all attendance for an event (includes all schedule players + their status)
  fastify.get<{ Params: { id: string } }>('/events/:id/attendance', async (req, reply) => {
    const { rows: [event] } = await pool.query(
      'SELECT schedule_id FROM events WHERE id = $1',
      [req.params.id]
    )
    if (!event) return reply.code(404).send({ error: 'Not found' })

    const { rows } = await pool.query(
      `SELECT p.id AS player_id, p.first_name, p.last_name,
              a.status, a.notes, a.updated_at
       FROM schedule_rosters sr
       JOIN players p ON p.roster_id = sr.roster_id
       LEFT JOIN attendance a
         ON a.event_id = $1 AND a.player_id = p.id
       WHERE sr.schedule_id = $2
       ORDER BY p.last_name, p.first_name`,
      [req.params.id, event.schedule_id]
    )
    return rows
  })

  // Upsert attendance for a player at an event
  fastify.put<{
    Params: { id: string; playerId: string }
    Body: { status: string | null; notes: string | null }
  }>('/events/:id/attendance/:playerId', async (req, reply) => {
    // Check if event is locked (start_time + 30 min < now in Pacific time)
    const { rows: [ev] } = await pool.query(
      `SELECT id FROM events
       WHERE id = $1
         AND ${LOCK_CONDITION}`,
      [req.params.id]
    )
    if (!ev) return reply.code(409).send({ error: 'Event is locked or not found' })

    const { status, notes } = req.body
    await pool.query(
      `INSERT INTO attendance (event_id, player_id, status, notes, updated_at)
       VALUES ($1, $2, $3, $4, now())
       ON CONFLICT (event_id, player_id) DO UPDATE
       SET status = EXCLUDED.status,
           notes = EXCLUDED.notes,
           updated_at = now()`,
      [req.params.id, req.params.playerId, status ?? null, notes ?? null]
    )
    reply.code(204).send()
  })

  done()
}

export default events
