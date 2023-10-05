#!/usr/bin/env node

import k from 'kleur'
import { clamp } from 'rambdax'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import buildCmd from './build'
import exportCmd from './export'
import previewCmd from './preview'
import serveCmd from './serve'

const cli = yargs(hideBin(process.argv))
  .scriptName('likec4')
  .usage(`Usage: $0 <command>`)
  .command(serveCmd)
  .command(buildCmd)
  .command(previewCmd)
  .command(exportCmd)
  .help('help')
  .version()
  .strictCommands()
  .demandCommand(1, 'Please run with valid command')
  .alias('v', 'version')
  .alias('h', 'help')
  .recommendCommands()
  .showHelpOnFail(false, 'Something is wrong, run with --help for available options')
  .updateStrings({
    'Options:': k.bold('Options:'),
    'Positionals:': k.bold('Arguments:'),
    'Commands:': k.bold('Commands:'),
    'Examples:': k.bold('Examples:')
  })
  .wrap(clamp(80, 120, process.stdout.columns - 20))
  .parseAsync()

cli.catch(() => process.exit(1))
