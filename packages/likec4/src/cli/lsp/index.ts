import k from 'tinyrainbow'
import type { Argv } from 'yargs'

import { configureLanguageServerLogger, startLanguageServer } from '@likec4/language-server'
import { createConnection, ProposedFeatures } from 'vscode-languageserver/node'
import { logLevel, path, useDotBin, verbose, verboseLogLevel } from '../options'

export default function<T>(yargs: Argv<T>) {
  return yargs
    .command({
      command: 'lsp',
      aliases: [],
      describe: 'Start LSP server',
      builder: y =>
        y
          .usage(`${k.bold('Usage:')} $0 lsp`)
          .option('log-level', logLevel)
          .option('verbose', verbose)
          .options({
            'node-ipc': {
              boolean: true,
              description: 'use node-ipc transport',
              conflicts: ['stdio', 'socket', 'pipe'],
            },
            'stdio': {
              boolean: true,
              description: 'use stdio transport',
              conflicts: ['node-ipc', 'socket', 'pipe'],
            },
            'socket': {
              number: true,
              description: 'use socket transport on specified port',
              conflicts: ['node-ipc', 'stdio', 'pipe'],
              nargs: 1,
            },
            'pipe': {
              string: true,
              description: 'use pipe transport with specified pipe name',
              conflicts: ['node-ipc', 'stdio', 'socket'],
              nargs: 1,
            },
            'manual-layouts': {
              boolean: true,
              description: 'enable/disable manual layouts',
              default: true,
              defaultDescription: 'enabled',
            },
            'watch': {
              alias: 'w',
              boolean: true,
              description: 'enable built-in watcher',
              default: false,
              defaultDescription: 'disabled',
            },
            'telemetry': {
              boolean: true,
              default: true,
              defaultDescription: 'IDE setting',
              description: 'enable/disable telemetry',
              hidden: true,
            },
          })
          .option('use-dot', useDotBin)
          .showHidden()
          .epilog(`${k.bold('Examples:')}

${k.green('$0 lsp --stdio ')}
${k.gray('Start LSP with stdio transport')}

${k.green('$0 lsp --node-ipc --watch --no-manual-layouts --no-color ')}
${k.gray('Start LSP with node-ipc transport and watcher, disabled manual layouts and disabled color')}

`),
      handler: args => {
        let connection

        if (args.nodeIpc || args.stdio || args.socket || args.pipe) {
          connection = createConnection(ProposedFeatures.all)
        } else {
          // If no transport is specified, use stdio
          throw new Error('No transport specified')
        }

        configureLanguageServerLogger({
          lspConnection: connection,
          useStdErr: args.stdio === true,
          colors: k.isColorSupported,
          enableTelemetry: args.telemetry,
          logLevel: args.verbose ? verboseLogLevel : args.logLevel,
        })

        startLanguageServer({
          connection,
          enableManualLayouts: args.manualLayouts,
          enableWatcher: args.watch,
          graphviz: args.useDot ? 'binary' : 'wasm',
          configureLogger: false,
        })
      },
    })
}
