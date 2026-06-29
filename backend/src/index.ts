import * as Sentry from '@sentry/node'
import { buildServer } from './server'

Sentry.init({
  dsn: 'https://84f925b4f46d44369415d860c28e4270@logs.tsteil.com/1',
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
