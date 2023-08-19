import { createConnection, ProposedFeatures } from 'vscode-languageserver/node'
import { startLanguageServer } from 'langium'
import { NodeFileSystem } from 'langium/node'
import { createLanguageServices } from '@likec4/language-server'

const connection = createConnection(ProposedFeatures.all)

const { shared } = createLanguageServices({ connection, ...NodeFileSystem })

startLanguageServer(shared)
