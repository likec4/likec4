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
import k from 'tinyrainbow'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { version } from '../../package.json' with { type: 'json' }
import buildCmd from './build'
import checkUpdateCmd, { notifyAvailableUpdate } from './check-update'
import codegenCmd from './codegen'
import exportCmd from './export'
import lspCmd from './lsp'
import mcpCmd from './mcp'
import { logLevel } from './options'
import previewCmd from './preview'
import serveCmd from './serve'
import validateCmd from './validate'

/**
 * Configure likec4 logger: verbose or dev => debug level, else info.
 */
function applyLoggerConfig(lowestLevel: (typeof logLevel)['choices'][number] = 'info') {
  configureLogger({
    reset: true,
    sinks: {
      console: getConsoleSink({
        formatter: k.isColorSupported ? getAnsiColorFormatter() : getConsoleFormatter(),
      }),
    },
    loggers: [
      {
        category: 'likec4',
        sinks: ['console'],
        lowestLevel,
      },
    ],
  })
}

/**
 * Parse CLI argv and run the requested command (serve, build, export, etc.).
 * Configures logger from --verbose, then parses yargs and runs the handler.
 */
async function main() {
  if (!DEV && !isInsideContainer()) {
    await notifyAvailableUpdate()
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
    lspCmd,
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
    .option('log-level', {
      ...logLevel,
      global: true,
    })
    .option('verbose', {
      boolean: true,
      describe: 'verbose logging',
      global: true,
    })
    .option('color', {
      boolean: true,
      describe: 'color output, force enable or disable with --no-color',
      skipValidation: true,
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
    .wrap(clamp(stdout.columns - 10, { min: 60, max: 180 }))
    .middleware((args) => {
      applyLoggerConfig(args.verbose ? 'debug' : args.logLevel)
    })
    .parseAsync()
}

/**
 * Single place for CLI failure: log error (message + stack via loggable) and exit with code 1.
 * @param err - Caught error or rejection value
 * @param prefix - Optional prefix for the error message (e.g. 'Unhandled rejection:')
 */
function exitWithFailure(err: unknown, prefix?: string): never {
  console.error(prefix != null ? `${prefix} ${loggable(err)}` : loggable(err))
  exit(1)
}

main().catch(exitWithFailure)

process.on('unhandledRejection', (err: unknown) => {
  exitWithFailure(err, 'Unhandled rejection:')
})

process.on('uncaughtException', (err) => {
  console.error(err)
})
