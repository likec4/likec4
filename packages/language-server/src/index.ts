import { startLanguageServer as startLanguim } from 'langium/lsp'
import { createConnection, ProposedFeatures } from 'vscode-languageserver/node'
import { LikeC4FileSystem } from './LikeC4FileSystem'
import { createLanguageServices } from './module'

export { logger as lspLogger, setLogLevel } from './logger'
export type * from './model'
export type * from './module'
export { createCustomLanguageServices, createLanguageServices, LikeC4Module } from './module'
export { LikeC4FileSystem }
export function startLanguageServer() {
  /* browser specific setup code */
  const connection = createConnection(ProposedFeatures.all)

  // Inject the shared services and language-specific services
  const services = createLanguageServices({ connection, ...LikeC4FileSystem })

  // Start the language server with the shared services
  startLanguim(services.shared)

  return {
    ...services,
    connection
  }
}
