import { configureLogger, getConsoleStderrSink } from '@likec4/log'
import { startLanguageServer as startLanguim } from 'langium/lsp'
import { createConnection, ProposedFeatures } from 'vscode-languageserver/node'
import { LikeC4FileSystem } from './filesystem/LikeC4FileSystem'
import { getLspConnectionSink, logger } from './logger'
import { WithMCPServer } from './mcp/server/WithMCPServer'
import { type LikeC4Services, type LikeC4SharedServices, createLanguageServices } from './module'
import { ConfigurableLayouter } from './views/ConfigurableLayouter'

/**
 * This is used as `bin` entry point to start the language server.
 */
export function startLanguageServer(): {
  shared: LikeC4SharedServices
  likec4: LikeC4Services
} {
  const connection = createConnection(ProposedFeatures.all)
  configureLogger({
    sinks: {
      // Name it as console to override internal logger
      lsp: getLspConnectionSink(connection),
      console: getConsoleStderrSink(),
    },
    loggers: [
      {
        category: ['likec4'],
        sinks: ['console', 'lsp'],
      },
    ],
  })

  process.on('uncaughtException', (err) => {
    logger.error('uncaughtException', { err })
  })

  process.on('unhandledRejection', (err) => {
    logger.error('unhandledRejection', { err })
  })

  // Inject the shared services and language-specific services
  const services = createLanguageServices(
    {
      connection,
      ...LikeC4FileSystem(false),
      ...WithMCPServer('sse'),
    },
    ConfigurableLayouter,
  )

  // Start the language server with the shared services
  startLanguim(services.shared)

  return services
}
