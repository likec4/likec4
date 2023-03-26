import { createLanguageServices } from '@likec4/language-server'
import { createConnection, ProposedFeatures } from 'vscode-languageserver/node'
import { startLanguageServer } from 'langium'
import { NodeFileSystem } from 'langium/node'

const connection = createConnection(ProposedFeatures.all)

const { shared } = createLanguageServices({ connection, ...NodeFileSystem })

startLanguageServer(shared)

process.on('unhandledRejection', (e) => {
  console.error('Unhandled exception', e)
})
