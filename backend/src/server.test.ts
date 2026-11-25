import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import fs from 'fs'
import path from 'path'
import { buildServer } from './server'

vi.mock('./migrate', () => ({ runMigrations: async () => {} }))
vi.mock('./db', () => ({ pool: { query: async () => ({ rows: [] }) } }))

// The production branch of buildServer (@fastify/static and the SPA fallback), which nothing
// else runs: a plugin that refuses this fastify version fails here, not at boot.
const indexHtml = path.join(__dirname, '../../frontend/dist/index.html')

describe('production server', () => {
  let server: Awaited<ReturnType<typeof buildServer>> | undefined

  beforeAll(async () => {
    if (!fs.existsSync(indexHtml)) {
      throw new Error(`${indexHtml} is missing: build the frontend first (pnpm verify does)`)
    }
    vi.stubEnv('NODE_ENV', 'production')
    server = await buildServer()
    await server.ready()
  })

  afterAll(async () => {
    vi.unstubAllEnvs()
    await server?.close()
  })

  it('serves index.html at /', async () => {
    const res = await server!.inject('/')
    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toMatch(/^text\/html/)
  })

  it('serves index.html for a deep link', async () => {
    const res = await server!.inject('/schedules/abc')
    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toMatch(/^text\/html/)
  })

  it('answers an API route next to the static files', async () => {
    const res = await server!.inject('/api/rosters')
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual([])
  })

  it('gives an unknown API route a JSON 404', async () => {
    const res = await server!.inject('/api/nope')
    expect(res.statusCode).toBe(404)
    expect(res.json()).toEqual({ error: 'Not Found' })
  })
})
