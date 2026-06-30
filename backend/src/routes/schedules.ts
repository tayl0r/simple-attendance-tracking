import { FastifyPluginCallback } from 'fastify'
import { pool } from '../db'
import { nanoid } from '../utils'
import { parseScheduleImport } from '../parsers/schedule'

const schedules: FastifyPluginCallback = (fastify, _opts, done) => {
  // List schedules
  fastify.get('/schedules', async () => {
    const { rows } = await pool.query(
      `SELECT s.id, s.name, s.created_at,
              COUNT(e.id)::int AS event_count
       FROM schedules s
       LEFT JOIN events e ON e.schedule_id = s.id
       GROUP BY s.id
       ORDER BY s.created_at DESC`
    )
    return rows
  })

  // Create schedule
  fastify.post<{ Body: { name: string } }>('/schedules', async (req, reply) => {
    const { rows: [row] } = await pool.query(
      'INSERT INTO schedules (id, name) VALUES ($1, $2) RETURNING *',
      [nanoid(), req.body.name]
    )
    reply.code(201)
    return row
  })

  // Get schedule with attached rosters
  fastify.get<{ Params: { id: string } }>('/schedules/:id', async (req, reply) => {
    const { rows: [schedule] } = await pool.query(
      'SELECT * FROM schedules WHERE id = $1',
      [req.params.id]
    )
    if (!schedule) return reply.code(404).send({ error: 'Not found' })

    const { rows: rosters } = await pool.query(
      `SELECT r.id, r.name
       FROM schedule_rosters sr
       JOIN rosters r ON r.id = sr.roster_id
       WHERE sr.schedule_id = $1
       ORDER BY r.name`,
      [req.params.id]
    )
    return { ...schedule, rosters }
  })

  // Update schedule name
  fastify.put<{ Params: { id: string }; Body: { name: string } }>(
    '/schedules/:id',
    async (req, reply) => {
      const { rows: [row] } = await pool.query(
        'UPDATE schedules SET name = $1 WHERE id = $2 RETURNING *',
        [req.body.name, req.params.id]
      )
      if (!row) return reply.code(404).send({ error: 'Not found' })
      return row
    }
  )

  // Delete schedule
  fastify.delete<{ Params: { id: string } }>('/schedules/:id', async (req, reply) => {
    await pool.query('DELETE FROM schedules WHERE id = $1', [req.params.id])
    reply.code(204).send()
  })

  // List events for schedule (sorted by date+time)
  fastify.get<{ Params: { id: string } }>('/schedules/:id/events', async (req, reply) => {
    const { rows: [schedule] } = await pool.query(
      'SELECT 1 FROM schedules WHERE id = $1',
      [req.params.id]
    )
    if (!schedule) return reply.code(404).send({ error: 'Not found' })

    const { rows } = await pool.query(
      `SELECT id, schedule_id, type, date::text, time::text,
              location, week, home_team, away_team, team
       FROM events
       WHERE schedule_id = $1
       ORDER BY date ASC, time ASC`,
      [req.params.id]
    )
    return rows
  })

  // Create event manually
  fastify.post<{
    Params: { id: string }
    Body: {
      type: string
      date: string
      time: string
      location: string
      week?: number | null
      home_team?: string | null
      away_team?: string | null
      team?: string | null
    }
  }>('/schedules/:id/events', async (req, reply) => {
    const { rows: [schedule] } = await pool.query(
      'SELECT 1 FROM schedules WHERE id = $1',
      [req.params.id]
    )
    if (!schedule) return reply.code(404).send({ error: 'Not found' })

    const { type, date, time, location, week, home_team, away_team, team } = req.body

    // Null out type-specific fields based on type
    const effectiveWeek = type === 'game' ? (week ?? null) : null
    const effectiveHomeTeam = type === 'game' ? (home_team ?? null) : null
    const effectiveAwayTeam = type === 'game' ? (away_team ?? null) : null
    const effectiveTeam = type === 'training' ? (team ?? null) : null

    const { rows: [row] } = await pool.query(
      `INSERT INTO events (id, schedule_id, type, date, time, location, week, home_team, away_team, team)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, schedule_id, type, date::text, time::text, location, week, home_team, away_team, team`,
      [nanoid(), req.params.id, type, date, time, location,
       effectiveWeek, effectiveHomeTeam, effectiveAwayTeam, effectiveTeam]
    )
    reply.code(201)
    return row
  })

  // Delete event
  fastify.delete<{ Params: { id: string; eventId: string } }>(
    '/schedules/:id/events/:eventId',
    async (req, reply) => {
      await pool.query(
        'DELETE FROM events WHERE id = $1 AND schedule_id = $2',
        [req.params.eventId, req.params.id]
      )
      reply.code(204).send()
    }
  )

  // Import schedule from paste
  fastify.post<{ Params: { id: string }; Body: { text: string } }>(
    '/schedules/:id/import',
    async (req, reply) => {
      const { rows: [schedule] } = await pool.query(
        'SELECT 1 FROM schedules WHERE id = $1',
        [req.params.id]
      )
      if (!schedule) return reply.code(404).send({ error: 'Not found' })

      const games = parseScheduleImport(req.body.text)
      let added = 0

      for (const g of games) {
        // Application-level de-dup: skip if this exact game already exists
        const { rows } = await pool.query(
          `SELECT 1 FROM events
           WHERE schedule_id = $1 AND type = 'game'
             AND date = $2 AND time = $3
             AND home_team = $4 AND away_team = $5 AND location = $6`,
          [req.params.id, g.date, g.time, g.homeTeam, g.awayTeam, g.location]
        )
        if (rows.length > 0) continue

        await pool.query(
          `INSERT INTO events (id, schedule_id, type, date, time, location, week, home_team, away_team)
           VALUES ($1, $2, 'game', $3, $4, $5, $6, $7, $8)`,
          [nanoid(), req.params.id, g.date, g.time, g.location,
           g.week ?? null, g.homeTeam, g.awayTeam]
        )
        added++
      }

      return { added }
    }
  )

  // Attach roster to schedule
  fastify.post<{ Params: { id: string }; Body: { roster_id: string } }>(
    '/schedules/:id/rosters',
    async (req, reply) => {
      const { rows: [schedule] } = await pool.query(
        'SELECT 1 FROM schedules WHERE id = $1',
        [req.params.id]
      )
      if (!schedule) return reply.code(404).send({ error: 'Not found' })

      const { rows: [roster] } = await pool.query(
        'SELECT 1 FROM rosters WHERE id = $1',
        [req.body.roster_id]
      )
      if (!roster) return reply.code(400).send({ error: 'Roster not found' })

      await pool.query(
        `INSERT INTO schedule_rosters (schedule_id, roster_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [req.params.id, req.body.roster_id]
      )
      reply.code(204).send()
    }
  )

  // Detach roster from schedule
  fastify.delete<{ Params: { id: string; rosterId: string } }>(
    '/schedules/:id/rosters/:rosterId',
    async (req, reply) => {
      await pool.query(
        'DELETE FROM schedule_rosters WHERE schedule_id = $1 AND roster_id = $2',
        [req.params.id, req.params.rosterId]
      )
      reply.code(204).send()
    }
  )

  // All players across attached rosters (for picker modal)
  fastify.get<{ Params: { id: string } }>('/schedules/:id/players', async (req, reply) => {
    const { rows: [schedule] } = await pool.query(
      'SELECT 1 FROM schedules WHERE id = $1',
      [req.params.id]
    )
    if (!schedule) return reply.code(404).send({ error: 'Not found' })

    const { rows } = await pool.query(
      `SELECT p.id, p.first_name, p.last_name
       FROM schedule_rosters sr
       JOIN players p ON p.roster_id = sr.roster_id
       WHERE sr.schedule_id = $1
       ORDER BY p.last_name, p.first_name`,
      [req.params.id]
    )
    return rows
  })

  done()
}

export default schedules
