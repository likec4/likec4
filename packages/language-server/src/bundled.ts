import { configureLogger, getConsoleSink } from '@likec4/log'
import { startLanguageServer as startLanguim } from 'langium/lsp'
import { createConnection, ProposedFeatures } from 'vscode-languageserver/node'
import { LikeC4FileSystem } from './LikeC4FileSystem'
import { logger } from './logger'
import { type LikeC4Services, type LikeC4SharedServices, createCustomLanguageServices } from './module'
import { ConfigurableLayouter } from './views/configurable-layouter'

/**
 * This is used as `bin` entry point to start the language server.
 */
export async function startLanguageServer(): Promise<{
  shared: LikeC4SharedServices
  likec4: LikeC4Services
}> {
  const connection = createConnection(ProposedFeatures.all)
  await configureLogger({
    sinks: {
      console: getConsoleSink(),
    },
    loggers: [
      {
        category: ['likec4'],
        sinks: ['console'],
      },
    ],
  })
  logger.info('Starting LikeC4 language server')
  // Inject the shared services and language-specific services
  const services = createCustomLanguageServices({ connection, ...LikeC4FileSystem }, ConfigurableLayouter)

  // Start the language server with the shared services
  startLanguim(services.shared)

  return services
}
