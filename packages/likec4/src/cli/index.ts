#!/usr/bin/env node

import { configureLogger, getConsoleSink } from '@likec4/log'
import { DEV } from 'esm-env'
import { argv, exit, stdout } from 'node:process'
import { clamp } from 'remeda'
import k from 'tinyrainbow'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { version } from '../../package.json' with { type: 'json' }
import buildCmd from './build'
import { checkAvailableUpdate, notifyAvailableUpdate } from './check-update'
import codegenCmd from './codegen'
import exportCmd from './export'
import previewCmd from './preview'
import serveCmd from './serve'
import validateCmd from './validate'

async function main() {
  await configureLogger({
    sinks: {
      console: getConsoleSink(),
    },
    loggers: [
      {
        category: 'likec4',
        sinks: ['console'],
        lowestLevel: DEV ? 'debug' : 'info',
      },
    ],
  })
  if (!DEV) {
    notifyAvailableUpdate()
  }

  return await yargs(hideBin(argv))
    .scriptName('likec4')
    .usage(`Usage: $0 <command>`)
    .command(serveCmd)
    .command(buildCmd)
    .command(codegenCmd)
    .command(exportCmd)
    .command(previewCmd)
    .command(validateCmd)
    .command({
      command: 'check-update',
      describe: 'Check for updates',
      handler: async () => {
        await checkAvailableUpdate()
      },
    })
    .help('help')
    .version(version)
    .alias('v', 'version')
    .alias('h', 'help')
    .demandCommand(1, 'Please run with valid command')
    .strict()
    .recommendCommands()
    .showHelpOnFail(true, 'Something is wrong, run with --help')
    .updateStrings({
      'Options:': k.bold('Options:'),
      'Positionals:': k.bold('Arguments:'),
      'Commands:': k.bold('Commands:'),
      'Examples:': k.bold('Examples:'),
    })
    .wrap(clamp(stdout.columns - 20, { min: 80, max: 120 }))
    .parseAsync()
}

main().catch(() => {
  exit(1)
})

process.on('unhandledRejection', (err) => {
  console.error(`Unhandled rejection`, err)
})
