import restana from 'restana'
import { errorLogger, logger } from './middlewares/logger'
import * as env from './libs/env'
import { error, info } from './libs/log'
import getApiRouter from './middlewares/api'

async function main() {
  const
    host = env.str('HOST', '127.0.0.1'),
    port = env.int('PORT', 8000)

  const server = restana({ errorHandler: errorLogger })
  server.use(logger)
  server.use('/api', getApiRouter(server.getRouter()))

  server.start(port, host)
    .then(() => info(`Server is listening on http://${host}:${port}`))
    .catch((err) => error('Failed to create the server', err))
}

if (require.main === module)
  main()