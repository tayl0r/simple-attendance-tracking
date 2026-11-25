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
    // Keep this sync and don't return the reply. Returning it makes fastify await the response
    // and add `close` listeners (MaxListenersExceededWarning on every deep link, fastify 5 +
    // Sentry); an async handler that doesn't return it sends an empty 200.
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
