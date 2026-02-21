import { configureLogger, getConsoleSink, getTextFormatter } from '@likec4/log'
import { startLanguageServer as startLanguim } from 'langium/lsp'
import { BrowserMessageReader, BrowserMessageWriter, createConnection } from 'vscode-languageserver/browser'
import type { LikeC4Services, LikeC4SharedServices } from '../module'
import { createLanguageServices } from '../module'

export type * from '../common-exports'

export {
  createLanguageServices,
  NoFileSystem,
  NoFileSystemWatcher,
  NoLikeC4ManualLayouts,
  NoMCPServer,
} from '../common-exports'

/**
 * Starts the LikeC4 language server in the browser, connected via the given port (e.g. a worker).
 * @param port - MessagePort or DedicatedWorkerGlobalScope for LSP communication.
 * @returns Shared and LikeC4-specific services after the connection is initialized.
 */
export function startLanguageServer(port: MessagePort | DedicatedWorkerGlobalScope): {
  shared: LikeC4SharedServices
  likec4: LikeC4Services
} {
  const messageReader = new BrowserMessageReader(port)
  const messageWriter = new BrowserMessageWriter(port)

  const connection = createConnection(messageReader, messageWriter)

  configureLogger({
    sinks: {
      console: getConsoleSink({
        formatter: getTextFormatter({
          format: ({ level, category, message }) => {
            return `${level} ${category} ${message}`
          },
        }),
      }),
    },
    loggers: [
      {
        category: 'likec4',
        sinks: ['console'],
        lowestLevel: 'debug',
      },
    ],
  })

  // Inject the shared services and language-specific services
  const services = createLanguageServices({ connection })

  // Start the language server with the shared services
  startLanguim(services.shared)

  return services
}
