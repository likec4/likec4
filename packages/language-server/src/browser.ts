import { configureLogger, getConsoleSink, getTextFormatter } from '@likec4/log'
import { startLanguageServer as startLanguim } from 'langium/lsp'
import { BrowserMessageReader, BrowserMessageWriter, createConnection } from 'vscode-languageserver/browser'
import { type LikeC4Services, type LikeC4SharedServices, createLanguageServices } from './module'

export type { DocumentParser, LikeC4ModelBuilder, LikeC4ModelLocator, LikeC4ModelParser } from './model'

export { NoFileSystem, NoLikeC4ManualLayouts } from './filesystem/index'
export type { LikeC4LanguageServices } from './LikeC4LanguageServices'
export { NoMCPServer } from './mcp/interfaces'
export type { LikeC4Services, LikeC4SharedServices } from './module'
export type { LikeC4Views } from './views'
export type { ProjectsManager } from './workspace'

export function startLanguageServer(port: MessagePort | DedicatedWorkerGlobalScope): {
  shared: LikeC4SharedServices
  likec4: LikeC4Services
} {
  /* browser specific setup code */

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
