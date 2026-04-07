import { configureLanguageServerLogger } from '@likec4/language-server'
import { WithFileSystem, WithLikeC4ManualLayouts } from '@likec4/language-server/filesystem'
import {
  createLanguageServices,
  WithWasmGraphviz,
} from '@likec4/language-server/module'
import { rootLogger } from '@likec4/log'
import { startLanguageServer as startLanguim } from 'langium/lsp'
import { createConnection, ProposedFeatures } from 'vscode-languageserver/node'

export interface StandaloneLspOptions {
  /**
   * Whether to enable file system watching.
   * @default false
   */
  enableWatcher?: boolean
  /**
   * Options for configuring the language server logger.
   * By default, logs are sent to stderr to avoid corrupting LSP protocol on stdout.
   */
  loggerOptions?: {
    /**
     * Whether to use stderr for logging instead of stdout.
     * @default true
     */
    useStdErr?: boolean
    /**
     * The log level to use.
     * @default 'info'
     */
    logLevel?: 'trace' | 'debug' | 'info' | 'warning' | 'error' | undefined

    /**
     * @default false
     */
    enableTelemetry?: boolean

    /**
     * Enable non-blocking logging (async).
     * @default false
     */
    nonBlocking?: boolean

    /**
     * Whether to use colors in logging.
     * @default false
     */
    colors?: boolean
  }
}

/**
 * Start the LikeC4 standalone language server.
 *
 * Transport is auto-detected from process.argv:
 * --stdio, --node-ipc, --socket=<port>, --pipe=<name>
 */
export function startStandaloneLsp(options?: StandaloneLspOptions) {
  const connection = createConnection(ProposedFeatures.all)
  configureLanguageServerLogger({
    lspConnection: connection,
    enableTelemetry: false,
    useStdErr: true,
    logLevel: 'info',
    ...options?.loggerOptions,
  })
  const logger = rootLogger.getChild('lsp')

  process.on('uncaughtException', (err) => {
    logger.error('uncaughtException', { err })
  })
  process.on('unhandledRejection', (err) => {
    logger.error('unhandledRejection', { err })
  })

  // Inject the shared services and language-specific services
  const services = createLanguageServices({
    connection,
    ...WithFileSystem(options?.enableWatcher ?? false),
    ...WithLikeC4ManualLayouts,
    ...WithWasmGraphviz,
  })

  // Start the language server with the shared services
  startLanguim(services.shared)
}
