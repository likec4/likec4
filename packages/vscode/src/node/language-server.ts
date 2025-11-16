import { startLanguageServer } from '@likec4/language-server'
import { rootLogger } from '@likec4/log'

const logger = rootLogger.getChild('server')
process.on('uncaughtException', (err) => {
  logger.error('uncaughtException', { err })
})
process.on('unhandledRejection', (err) => {
  logger.error('unhandledRejection', { err })
})

startLanguageServer({
  enableWatcher: false,
})
