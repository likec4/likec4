import { configureLogger } from '@likec4/log'
import { startLanguageServer as startLanguim } from 'langium/lsp'
import { createConnection, ProposedFeatures } from 'vscode-languageserver/node'
import { LikeC4FileSystem } from './LikeC4FileSystem'
import { getLspConnectionSink, logger } from './logger'
import { type LikeC4Services, type LikeC4SharedServices, createCustomLanguageServices } from './module'
import { ConfigurableLayouter } from './views/configurable-layouter'

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
      console: getLspConnectionSink(connection),
    },
    loggers: [
      {
        category: ['likec4'],
        sinks: ['console'],
      },
    ],
  })
  // Inject the shared services and language-specific services
  const services = createCustomLanguageServices({ connection, ...LikeC4FileSystem }, ConfigurableLayouter)

  // Start the language server with the shared services
  startLanguim(services.shared)

  return services
}
