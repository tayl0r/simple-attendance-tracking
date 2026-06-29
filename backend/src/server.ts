import * as Sentry from '@sentry/node'
import Fastify from 'fastify'
import fastifyStatic from '@fastify/static'
import path from 'path'
import { runMigrations } from './migrate'
import rostersPlugin from './routes/rosters'
import schedulesPlugin from './routes/schedules'
import eventsPlugin from './routes/events'

export async function buildServer() {
  const fastify = Fastify({ logger: true })

  Sentry.setupFastifyErrorHandler(fastify)

  await runMigrations()

  await fastify.register(rostersPlugin, { prefix: '/api' })
  await fastify.register(schedulesPlugin, { prefix: '/api' })
  await fastify.register(eventsPlugin, { prefix: '/api' })

  if (process.env.NODE_ENV === 'production') {
    const frontendDist = path.join(__dirname, '../../frontend/dist')
    await fastify.register(fastifyStatic, { root: frontendDist })
    fastify.setNotFoundHandler(async (req, reply) => {
      if (req.method === 'GET' && !req.url.startsWith('/api')) {
        return reply.sendFile('index.html')
      }
      reply.code(404).send({ error: 'Not Found' })
    })
  }

  return fastify
}
