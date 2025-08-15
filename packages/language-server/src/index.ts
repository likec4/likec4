import { configureLogger, getConsoleSink, getTextFormatter } from '@likec4/log'
import { defu } from 'defu'
import { startLanguageServer as startLanguim } from 'langium/lsp'
import { createConnection, ProposedFeatures } from 'vscode-languageserver/node'
import { LikeC4FileSystem } from './filesystem/LikeC4FileSystem'
import { getTelemetrySink, logger } from './logger'
import { WithMCPServer } from './mcp/server/WithMCPServer'
import { type LikeC4Services, type LikeC4SharedServices, createLanguageServices } from './module'
import { ConfigurableLayouter } from './views/configurable-layouter'

export { getLspConnectionSink, logger as lspLogger } from './logger'

export type { DocumentParser, LikeC4ModelBuilder, LikeC4ModelLocator, LikeC4ModelParser } from './model'

export type { LikeC4LanguageServices } from './LikeC4LanguageServices'
export { isLikeC4Builtin } from './likec4lib'
export { createLanguageServices } from './module'
export type { LikeC4Services, LikeC4SharedServices } from './module'
export type { LikeC4Views } from './views'
export { LikeC4FileSystem, WithMCPServer }

type StartLanguageServerOptions = {
  /**
   * Whether to enable the file system watcher.
   * @default true
   */
  enableWatcher?: boolean
  /**
   * Whether to enable the MCP server.
   * @default 'sse'
   */
  enableMCP?: false | 'sse' | 'stdio'
}

export function startLanguageServer(options?: StartLanguageServerOptions): {
  shared: LikeC4SharedServices
  likec4: LikeC4Services
} {
  const opts = defu(options, {
    enableWatcher: true,
    enableMCP: 'sse' as const,
  })
  const connection = createConnection(ProposedFeatures.all)

  configureLogger({
    sinks: {
      console: getConsoleSink({
        formatter: getTextFormatter(),
      }),
      telemetry: getTelemetrySink(connection),
    },
    loggers: [
      {
        category: ['likec4'],
        sinks: ['console', 'telemetry'],
      },
    ],
  })
  logger.info('Starting LikeC4 language server')
  // Inject the shared services and language-specific services
  const services = createLanguageServices(
    {
      connection,
      ...LikeC4FileSystem(opts.enableWatcher),
      ...opts.enableMCP && WithMCPServer(opts.enableMCP),
    },
    {
      likec4: {
        ...ConfigurableLayouter.likec4,
      },
    },
  )

  // Start the language server with the shared services
  startLanguim(services.shared)

  return services
}
