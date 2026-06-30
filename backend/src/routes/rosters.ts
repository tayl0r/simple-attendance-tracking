import { FastifyPluginCallback } from 'fastify'
import { pool } from '../db'
import { nanoid } from '../utils'
import { parsePlayerImport } from '../parsers/players'

const rosters: FastifyPluginCallback = (fastify, _opts, done) => {
  // List all rosters
  fastify.get('/rosters', async () => {
    const { rows } = await pool.query(
      `SELECT r.id, r.name, r.created_at,
              COUNT(p.id)::int AS player_count
       FROM rosters r
       LEFT JOIN players p ON p.roster_id = r.id
       GROUP BY r.id
       ORDER BY r.created_at DESC`
    )
    return rows
  })

  // Create roster
  fastify.post<{ Body: { name: string } }>('/rosters', async (req, reply) => {
    const { rows: [row] } = await pool.query(
      'INSERT INTO rosters (id, name) VALUES ($1, $2) RETURNING *',
      [nanoid(), req.body.name]
    )
    reply.code(201)
    return row
  })

  // Get roster with players
  fastify.get<{ Params: { id: string } }>('/rosters/:id', async (req, reply) => {
    const { rows: [roster] } = await pool.query(
      'SELECT * FROM rosters WHERE id = $1',
      [req.params.id]
    )
    if (!roster) return reply.code(404).send({ error: 'Not found' })

    const { rows: players } = await pool.query(
      `SELECT id, first_name, last_name
       FROM players WHERE roster_id = $1
       ORDER BY last_name, first_name`,
      [req.params.id]
    )
    return { ...roster, players }
  })

  // Update roster name
  fastify.put<{ Params: { id: string }; Body: { name: string } }>(
    '/rosters/:id',
    async (req, reply) => {
      const { rows: [row] } = await pool.query(
        'UPDATE rosters SET name = $1 WHERE id = $2 RETURNING *',
        [req.body.name, req.params.id]
      )
      if (!row) return reply.code(404).send({ error: 'Not found' })
      return row
    }
  )

  // Delete roster (blocked if attached to any schedule)
  fastify.delete<{ Params: { id: string } }>('/rosters/:id', async (req, reply) => {
    const { rows } = await pool.query(
      'SELECT 1 FROM schedule_rosters WHERE roster_id = $1',
      [req.params.id]
    )
    if (rows.length > 0) {
      return reply.code(409).send({ error: 'Roster is attached to a schedule' })
    }
    await pool.query('DELETE FROM rosters WHERE id = $1', [req.params.id])
    reply.code(204).send()
  })

  // Add player manually
  fastify.post<{
    Params: { id: string }
    Body: { first_name: string; last_name: string }
  }>('/rosters/:id/players', async (req, reply) => {
    const { first_name, last_name } = req.body
    const { rows: [row] } = await pool.query(
      `INSERT INTO players (id, roster_id, first_name, last_name)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (roster_id, first_name, last_name) DO NOTHING
       RETURNING *`,
      [nanoid(), req.params.id, first_name, last_name]
    )
    if (!row) return reply.code(409).send({ error: 'Player already exists' })
    reply.code(201)
    return row
  })

  // Update player name
  fastify.put<{ Params: { id: string; playerId: string }; Body: { first_name: string; last_name: string } }>(
    '/rosters/:id/players/:playerId',
    async (req, reply) => {
      const { first_name, last_name } = req.body
      const { rows } = await pool.query(
        'UPDATE players SET first_name = $1, last_name = $2 WHERE id = $3 AND roster_id = $4 RETURNING *',
        [first_name, last_name, req.params.playerId, req.params.id]
      )
      if (!rows[0]) return reply.code(404).send({ error: 'Not found' })
      return rows[0]
    }
  )

  // Delete player
  fastify.delete<{ Params: { id: string; playerId: string } }>(
    '/rosters/:id/players/:playerId',
    async (req, reply) => {
      await pool.query('DELETE FROM players WHERE id = $1 AND roster_id = $2', [
        req.params.playerId,
        req.params.id,
      ])
      reply.code(204).send()
    }
  )

  // Import players from paste
  fastify.post<{ Params: { id: string }; Body: { text: string } }>(
    '/rosters/:id/import',
    async (req) => {
      const parsed = parsePlayerImport(req.body.text)
      let added = 0
      for (const p of parsed) {
        const result = await pool.query(
          `INSERT INTO players (id, roster_id, first_name, last_name)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (roster_id, first_name, last_name) DO NOTHING`,
          [nanoid(), req.params.id, p.firstName, p.lastName]
        )
        if ((result.rowCount ?? 0) > 0) added++
      }
      return { added }
    }
  )

  done()
}

export default rosters
