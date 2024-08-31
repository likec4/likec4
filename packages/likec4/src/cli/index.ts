#!/usr/bin/env node

import { consola, LogLevels } from '@likec4/log'
import { argv, exit, stdout } from 'node:process'
import { clamp } from 'remeda'
import k from 'tinyrainbow'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import pkg from '../../package.json' with { type: 'json' }
import buildCmd from './build'
import codegenCmd from './codegen'
import exportCmd from './export'
import previewCmd from './preview'
import serveCmd from './serve'

consola.level = LogLevels.info
// @ts-expect-error
if (process.env.NODE_ENV !== 'production') {
  consola.level = LogLevels.trace
  consola.warn('running in dev mode')
}

const cli = yargs(hideBin(argv))
  .scriptName('likec4')
  .usage(`Usage: $0 <command>`)
  .command(serveCmd)
  .command(buildCmd)
  .command(codegenCmd)
  .command(exportCmd)
  .command(previewCmd)
  .help('help')
  .version(pkg.version)
  .alias('v', 'version')
  .alias('h', 'help')
  .demandCommand(1, 'Please run with valid command')
  .strict()
  .recommendCommands()
  .showHelpOnFail(false, 'Something is wrong, run with --help for available options')
  .updateStrings({
    'Options:': k.bold('Options:'),
    'Positionals:': k.bold('Arguments:'),
    'Commands:': k.bold('Commands:'),
    'Examples:': k.bold('Examples:')
  })
  .wrap(clamp(stdout.columns - 20, { min: 80, max: 120 }))
  .parseAsync()

cli.catch(() => exit(1))

process.on('unhandledRejection', (err) => {
  consola.error(err)
})
