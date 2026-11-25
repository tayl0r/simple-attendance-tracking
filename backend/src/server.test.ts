import { describe, it, expect, vi, beforeAll } from 'vitest'
import fs from 'fs'
import path from 'path'
import { buildServer, frontendDist } from './server'

vi.mock('./migrate', () => ({ runMigrations: async () => {} }))
vi.mock('./db', () => ({ pool: { query: async () => ({ rows: [] }) } }))

// Covers buildServer's production-only branch (static + SPA fallback), so an incompatible
// plugin fails here, not at boot.
const indexHtml = path.join(frontendDist, 'index.html')

describe('production server', () => {
  let server: Awaited<ReturnType<typeof buildServer>>

  beforeAll(async () => {
    if (!fs.existsSync(indexHtml)) {
      throw new Error(`${indexHtml} is missing: build the frontend first (pnpm verify does)`)
    }
    vi.stubEnv('NODE_ENV', 'production')
    server = await buildServer()
    await server.ready()
    return async () => {
      vi.unstubAllEnvs()
      await server.close()
    }
  })

  it.each(['/', '/schedules/abc'])('serves index.html for %s', async (url) => {
    const res = await server.inject(url)
    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toMatch(/^text\/html/)
  })

  it('answers an API route next to the static files', async () => {
    const res = await server.inject('/api/rosters')
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual([])
  })

  it('gives an unknown API route a JSON 404', async () => {
    const res = await server.inject('/api/nope')
    expect(res.statusCode).toBe(404)
    expect(res.json()).toEqual({ error: 'Not Found' })
  })
})
