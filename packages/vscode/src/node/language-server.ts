import { configureLanguageServerLogger, startLanguageServer } from '@likec4/language-server'
import { rootLogger } from '@likec4/log'
import { isDevelopment } from 'std-env'
import { createConnection, ProposedFeatures } from 'vscode-languageserver/node'

const logger = rootLogger.getChild('server')
process.on('uncaughtException', (err) => {
  logger.error('uncaughtException', { err })
})
process.on('unhandledRejection', (err) => {
  logger.error('unhandledRejection', { err })
})

const connection = createConnection(ProposedFeatures.all)

configureLanguageServerLogger({
  lspConnection: connection,
  logLevel: isDevelopment ? 'trace' : 'debug',
})

startLanguageServer({
  connection,
  configureLogger: false,
  enableWatcher: false, // Extension is responsible for watching files and sending notifications
})
