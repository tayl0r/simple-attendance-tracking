import { buildServer } from './server'

const port = parseInt(process.env.PORT ?? '3000', 10)

buildServer()
  .then(server => server.listen({ port, host: '0.0.0.0' }))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
