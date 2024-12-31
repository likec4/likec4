import { startLanguageServer as startLanguim } from 'langium/lsp'
import { createConnection, ProposedFeatures } from 'vscode-languageserver/node'
import { LikeC4FileSystem } from './LikeC4FileSystem'
import { createLanguageServices, type LikeC4Services, type LikeC4SharedServices } from './module'

export { logger as lspLogger, setLogLevel } from './logger'

export type { DocumentParser, LikeC4ModelBuilder, LikeC4ModelLocator, LikeC4ModelParser } from './model'

export { createCustomLanguageServices, createLanguageServices, LikeC4Module } from './module'
export type { LikeC4Services, LikeC4SharedServices } from './module'
export { LikeC4FileSystem }

export function startLanguageServer(): {
  shared: LikeC4SharedServices
  likec4: LikeC4Services
} {
  /* browser specific setup code */
  const connection = createConnection(ProposedFeatures.all)

  // Inject the shared services and language-specific services
  const services = createLanguageServices({ connection, ...LikeC4FileSystem })

  // Start the language server with the shared services
  startLanguim(services.shared)

  return services
}
