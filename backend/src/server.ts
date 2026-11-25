import * as Sentry from '@sentry/node'
import Fastify from 'fastify'
import fastifyStatic from '@fastify/static'
import path from 'path'
import { runMigrations } from './migrate'
import rostersPlugin from './routes/rosters'
import schedulesPlugin from './routes/schedules'
import eventsPlugin from './routes/events'

export const frontendDist = path.join(__dirname, '../../frontend/dist')

export async function buildServer() {
  const fastify = Fastify({ logger: true })

  Sentry.setupFastifyErrorHandler(fastify)

  await runMigrations()

  await fastify.register(rostersPlugin, { prefix: '/api' })
  await fastify.register(schedulesPlugin, { prefix: '/api' })
  await fastify.register(eventsPlugin, { prefix: '/api' })

  if (process.env.NODE_ENV === 'production') {
    await fastify.register(fastifyStatic, { root: frontendDist })
    // Sync, and not returning the reply: sendFile() returns the reply before it's sent, and a
    // reply is a thenable, so an async handler returning it makes fastify wait on the response
    // finishing, which adds `close` listeners to it. On fastify 5 with Sentry enabled, that
    // passed Node's limit and logged a MaxListenersExceededWarning on every deep link.
    fastify.setNotFoundHandler((req, reply) => {
      if (req.method === 'GET' && !req.url.startsWith('/api')) {
        reply.sendFile('index.html')
      } else {
        reply.code(404).send({ error: 'Not Found' })
      }
    })
  }

  return fastify
}
