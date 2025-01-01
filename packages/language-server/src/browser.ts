import { startLanguageServer as startLanguim } from 'langium/lsp'
import { BrowserMessageReader, BrowserMessageWriter, createConnection } from 'vscode-languageserver/browser'
import { type LikeC4Services, type LikeC4SharedServices, createLanguageServices } from './module'

export { logger as lspLogger, setLogLevel } from './logger'
export type { DocumentParser, LikeC4ModelBuilder, LikeC4ModelLocator, LikeC4ModelParser } from './model'

export { createCustomLanguageServices, createLanguageServices, LikeC4Module } from './module'
export type { LikeC4Services, LikeC4SharedServices } from './module'
export type { LikeC4Views } from './views'

// This is an example copied as is from here:
// https://github.com/microsoft/vscode-extension-samples/blob/main/lsp-web-extension-sample/server/src/browserServerMain.ts
// the only addition is the following line:
declare const self: DedicatedWorkerGlobalScope

export function startLanguageServer(): {
  shared: LikeC4SharedServices
  likec4: LikeC4Services
} {
  /* browser specific setup code */

  const messageReader = new BrowserMessageReader(self)
  const messageWriter = new BrowserMessageWriter(self)

  const connection = createConnection(messageReader, messageWriter)

  // Inject the shared services and language-specific services
  const services = createLanguageServices({ connection })

  // Start the language server with the shared services
  startLanguim(services.shared)

  return services
}
