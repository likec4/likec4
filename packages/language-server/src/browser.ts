import { configureLogger, getAnsiColorFormatter, getConsoleSink } from '@likec4/log'
import { startLanguageServer as startLanguim } from 'langium/lsp'
import { BrowserMessageReader, BrowserMessageWriter, createConnection } from 'vscode-languageserver/browser'
import { type LikeC4Services, type LikeC4SharedServices, createLanguageServices } from './module'

export { logger as lspLogger } from './logger'
export type { DocumentParser, LikeC4ModelBuilder, LikeC4ModelLocator, LikeC4ModelParser } from './model'

export { createCustomLanguageServices, createLanguageServices, LikeC4Module } from './module'
export type { LikeC4Services, LikeC4SharedServices } from './module'
export type { LikeC4Views } from './views'

export async function startLanguageServer(port: MessagePort | DedicatedWorkerGlobalScope): Promise<{
  shared: LikeC4SharedServices
  likec4: LikeC4Services
}> {
  /* browser specific setup code */

  const messageReader = new BrowserMessageReader(port)
  const messageWriter = new BrowserMessageWriter(port)

  const connection = createConnection(messageReader, messageWriter)
  await configureLogger({
    sinks: {
      console: getConsoleSink({
        formatter: getAnsiColorFormatter({
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
