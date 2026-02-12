#!/usr/bin/env node

import {
  configureLogger,
  getAnsiColorFormatter,
  getConsoleFormatter,
  getConsoleSink,
  loggable,
} from '@likec4/log'
import { DEV } from 'esm-env'
import isInsideContainer from 'is-inside-container'
import { argv, exit, stdout } from 'node:process'
import { clamp, pipe } from 'remeda'
import { isDevelopment } from 'std-env'
import k from 'tinyrainbow'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { version } from '../../package.json' with { type: 'json' }
import buildCmd from './build'
import checkUpdateCmd, { notifyAvailableUpdate } from './check-update'
import codegenCmd from './codegen'
import exportCmd from './export'
import mcpCmd from './mcp'
import previewCmd from './preview'
import serveCmd from './serve'
import validateCmd from './validate'

/** Configure likec4 logger: verbose or dev => debug level, else info. */
function applyLoggerConfig(isDebug = isDevelopment) {
  configureLogger({
    sinks: {
      console: getConsoleSink({
        formatter: k.isColorSupported ? getAnsiColorFormatter() : getConsoleFormatter(),
      }),
    },
    loggers: [
      {
        category: 'likec4',
        sinks: ['console'],
        lowestLevel: isDebug ? 'debug' : 'info',
      },
    ],
  })
}

async function main() {
  if (!DEV && !isInsideContainer()) {
    notifyAvailableUpdate()
  }

  const y = pipe(
    yargs(hideBin(argv)),
    serveCmd,
    buildCmd,
    codegenCmd,
    exportCmd,
    previewCmd,
    validateCmd,
    mcpCmd,
    checkUpdateCmd,
    yargs =>
      yargs.command({
        command: 'completion',
        describe: 'Generate completion script',
        handler: () => {
          yargs.showCompletionScript()
        },
      }),
  )

  await y
    .scriptName('likec4')
    .usage(`Usage: $0 <command>`)
    .version(version)
    .alias('v', 'version')
    .alias('h', 'help')
    .help('help')
    .option('verbose', {
      type: 'boolean',
      describe: 'verbose logging',
      global: true,
    })
    .demandCommand(1, 'Please run with valid command')
    .recommendCommands()
    .showHelpOnFail(true)
    .updateStrings({
      'Options:': k.bold('Options:'),
      'Positionals:': k.bold('Arguments:'),
      'Commands:': k.bold('Commands:'),
      'Examples:': k.bold('Examples:'),
    })
    .wrap(clamp(stdout.columns - 10, { min: 80, max: 150 }))
    .middleware((args) => {
      applyLoggerConfig(args.verbose || isDevelopment)
    })
    .parseAsync()
}

/** Single place for CLI failure: log error (message + stack via loggable) and exit with code 1. */
function exitWithFailure(err: unknown): never {
  console.error(loggable(err))
  exit(1)
}

main().catch(exitWithFailure)

process.on('unhandledRejection', (err: unknown) => {
  console.error('Unhandled rejection:', loggable(err))
  exit(1)
})
