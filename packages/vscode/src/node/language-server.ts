import { createConnection, ProposedFeatures } from 'vscode-languageserver/node'
import { startLanguageServer } from 'langium'
import { NodeFileSystem } from 'langium/node'
import { createLanguageServices } from '@likec4/language-server'

const connection = createConnection(ProposedFeatures.all)

// const myFormat = format.printf(({ level, message, label, name, timestamp }) => {
//   return `[${level.toUpperCase()} ${timestamp}][${name ?? label}] ${message}`
// })

// logger.configure({
//   format: format.combine(format.timestamp(), format.errors({ stack: true }), myFormat),
//   level: 'debug',
//   transports: [
//     new transports.Console({
//       consoleWarnLevels: ['warn'],
//       stderrLevels: ['error']
//     })
//   ]
// })

const { shared } = createLanguageServices({ connection, ...NodeFileSystem })

startLanguageServer(shared)
