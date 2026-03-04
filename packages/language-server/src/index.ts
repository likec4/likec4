import { GraphvizWasmAdapter } from '@likec4/layouts'
import { GraphvizBinaryAdapter } from '@likec4/layouts/graphviz/binary'
import { defu } from 'defu'
import { startLanguageServer as startLanguim } from 'langium/lsp'
import type { Connection } from 'vscode-languageserver'
import { configureLanguageServerLogger } from './configureLogger'
import { WithFileSystem } from './filesystem/LikeC4FileSystem'
import { WithLikeC4ManualLayouts } from './filesystem/LikeC4ManualLayouts'
import { logger } from './logger'
import { WithMCPServer } from './mcp'
import type { LikeC4Services, LikeC4SharedServices } from './module'
import { createLanguageServices, WithGraphviz } from './module'
import { ConfigurableLayouter } from './views/ConfigurableLayouter'

export type * from './common-exports'

export {
  createLanguageServices,
  NoFileSystem,
  NoFileSystemWatcher,
  NoLikeC4ManualLayouts,
  NoMCPServer,
} from './common-exports'

export {
  configureLanguageServerLogger,
  type ConfigureLanguageServerLoggerOptions,
} from './configureLogger'

export {
  WithFileSystem,
  WithLikeC4ManualLayouts,
  WithMCPServer,
}

interface StartLanguageServerOptions {
  /**
   * The Language Server Protocol connection to use.
   */
  connection?: Connection
  /**
   * Whether to enable the file system watcher.
   * @default true
   */
  enableWatcher?: boolean
  /**
   * Whether to enable the MCP server.
   * @default 'sse'
   */
  enableMCP?: false | 'stdio' | 'sse' | { port: number }

  /**
   * Whether to enable manual layouts, stored in json5 files.
   * @default true
   */
  enableManualLayouts?: boolean

  /**
   * Whether to use the `dot` binary for layouting or the WebAssembly version.
   * If {@link connection} is set, {@link ConfigurableLayouter} is started
   * and this option controls the default layouter implementation used by it.
   *
   * @default 'wasm'
   */
  graphviz?: 'wasm' | 'binary'

  /**
   * Whether to configure the logger.
   *
   * - `false` - don't configure the logger
   * - `'console'` - configure the logger with console sink
   * - `'stderr'` - configure the logger with stderr sink
   *
   * @default false
   */
  configureLogger?: false | 'console' | 'stderr'
}

export function startLanguageServer(options?: StartLanguageServerOptions): {
  shared: LikeC4SharedServices
  likec4: LikeC4Services
} {
  const connection = options?.connection

  const opts = defu(options, {
    enableWatcher: true,
    enableMCP: 'sse' as const,
    enableManualLayouts: true,
    graphviz: 'wasm' as const,
    configureLogger: false,
  })

  if (opts.configureLogger !== false) {
    if (opts.configureLogger === 'stderr' || opts.enableMCP === 'stdio') {
      configureLanguageServerLogger({
        lspConnection: connection,
        enableTelemetry: false,
        useStdErr: true,
      })
    } else if (opts.configureLogger === 'console') {
      configureLanguageServerLogger({
        lspConnection: connection,
      })
    }
  }

  if (connection) {
    logger.info('Starting LikeC4 language server')
  } else {
    logger.warn('Starting LikeC4 language server (headless - no LSP connection)')
  }

  // Inject the shared services and language-specific services
  const services = createLanguageServices(
    {
      ...connection && { connection },
      ...WithFileSystem(opts.enableWatcher),
      ...!!opts.enableMCP && WithMCPServer(opts.enableMCP),
      ...opts.enableManualLayouts && WithLikeC4ManualLayouts,
      ...WithGraphviz(opts.graphviz === 'binary' ? new GraphvizBinaryAdapter() : new GraphvizWasmAdapter()),
    },
    connection
      ? {
        likec4: {
          ...ConfigurableLayouter.likec4,
        },
      }
      : undefined,
  )

  // Start the language server with the shared services
  startLanguim(services.shared)

  return services
}
