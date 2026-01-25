import { configureLogger, getConsoleStderrSink } from '@likec4/log'
import { defu } from 'defu'
import { startLanguageServer as startLanguim } from 'langium/lsp'
import { isDevelopment } from 'std-env'
import { createConnection, ProposedFeatures } from 'vscode-languageserver/node'
import { WithFileSystem } from './filesystem/LikeC4FileSystem'
import { WithLikeC4ManualLayouts } from './filesystem/LikeC4ManualLayouts'
import { getLspConnectionSink, logger } from './logger'
import { WithMCPServer } from './mcp/server/WithMCPServer'
import type { LikeC4Services, LikeC4SharedServices } from './module'
import { createLanguageServices } from './module'
import { ConfigurableLayouter } from './views/ConfigurableLayouter'

type StartBundledLanguageServerOptions = {
  /**
   * Whether to enable the MCP server.
   * @default true
   */
  enableMCP?: boolean | { port: number }

  /**
   * Whether to enable manual layouts, stored in json5 files.
   * @default true
   */
  enableManualLayouts?: boolean
}

/**
 * This is used as `bin` entry point to start the language server.
 */
export function startLanguageServer(options?: StartBundledLanguageServerOptions): {
  shared: LikeC4SharedServices
  likec4: LikeC4Services
} {
  const opts = defu(options, {
    enableMCP: true,
    enableManualLayouts: true,
  })
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
        lowestLevel: isDevelopment ? 'trace' : 'debug',
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
      ...WithFileSystem(false),
      ...(opts.enableMCP !== false && WithMCPServer(opts.enableMCP === true ? 'sse' : opts.enableMCP)),
      ...(opts.enableManualLayouts && WithLikeC4ManualLayouts),
    },
    ConfigurableLayouter,
  )

  // Start the language server with the shared services
  startLanguim(services.shared)

  return services
}
