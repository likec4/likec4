import { createLanguageServices } from '@likec4/language-server'
import { startLanguageServer as startLanguim } from 'langium/lsp'
import { NodeFileSystem } from 'langium/node'
import { createConnection, ProposedFeatures } from 'vscode-languageserver/node'

// Create a connection for the server. The connection uses Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all)

// Inject the shared services and language-specific services
const services = createLanguageServices({ connection, ...NodeFileSystem })

// Start the language server with the shared services
startLanguim(services.shared)
