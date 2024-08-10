import { startLanguageServer as startLanguim } from 'langium/lsp'
import { NodeFileSystem } from 'langium/node'
import { createConnection, ProposedFeatures } from 'vscode-languageserver/node'
import { createLanguageServices } from './module'

export function startLanguageServer() {
  /* browser specific setup code */
  const connection = createConnection(ProposedFeatures.all)

  // Inject the shared services and language-specific services
  const services = createLanguageServices({ connection, ...NodeFileSystem })

  // Start the language server with the shared services
  startLanguim(services.shared)

  return {
    ...services,
    connection
  }
}
