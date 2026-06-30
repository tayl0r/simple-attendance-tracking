import * as Sentry from '@sentry/node'
import { buildServer } from './server'

Sentry.init({
  dsn: process.env.GLITCHTIP_DSN,
  environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'development',
})

const port = parseInt(process.env.PORT ?? '3000', 10)

buildServer()
  .then(server => server.listen({ port, host: '0.0.0.0' }))
  .catch(err => {
    Sentry.captureException(err)
    console.error(err)
    process.exit(1)
  })
