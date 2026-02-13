import { startLanguageServer } from '@likec4/language-server'
import { rootLogger } from '@likec4/log'
import { createConnection, ProposedFeatures } from 'vscode-languageserver/node'

const logger = rootLogger.getChild('server')
process.on('uncaughtException', (err) => {
  logger.error('uncaughtException', { err })
})
process.on('unhandledRejection', (err) => {
  logger.error('unhandledRejection', { err })
})

const connection = createConnection(ProposedFeatures.all)

startLanguageServer({
  connection,
  enableWatcher: false, // Extension is responsible for watching files and sending notifications
})
