import { configureLogger, getConsoleSink } from '@likec4/log'
import { startLanguageServer as startLanguim } from 'langium/lsp'
import { BrowserMessageReader, BrowserMessageWriter, createConnection } from 'vscode-languageserver/browser'
import { getLspConnectionSink } from './logger'
import { type LikeC4Services, type LikeC4SharedServices, createLanguageServices } from './module'

export { logger as lspLogger } from './logger'
export type { DocumentParser, LikeC4ModelBuilder, LikeC4ModelLocator, LikeC4ModelParser } from './model'

export { createCustomLanguageServices, createLanguageServices, LikeC4Module } from './module'
export type { LikeC4Services, LikeC4SharedServices } from './module'
export type { LikeC4Views } from './views'

// This is an example copied as is from here:
// https://github.com/microsoft/vscode-extension-samples/blob/main/lsp-web-extension-sample/server/src/browserServerMain.ts
// the only addition is the following line:
declare const self: DedicatedWorkerGlobalScope

export async function startLanguageServer(): Promise<{
  shared: LikeC4SharedServices
  likec4: LikeC4Services
}> {
  /* browser specific setup code */

  const messageReader = new BrowserMessageReader(self)
  const messageWriter = new BrowserMessageWriter(self)

  const connection = createConnection(messageReader, messageWriter)
  await configureLogger({
    sinks: {
      console: getConsoleSink(),
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
