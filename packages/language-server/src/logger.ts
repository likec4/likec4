/* eslint-disable @typescript-eslint/no-explicit-any */
import { type ConsolaReporter, LogLevels, rootLogger as root } from '@likec4/log'
import type { Connection } from 'vscode-languageserver'

export const logger = root.withTag('lsp')

export function logError(err: unknown): void {
  logger.error(err)
}

export function logWarnError(err: unknown): void {
  if (err instanceof Error) {
    logger.warn(err.stack ?? err.message)
    return
  }
  logger.warn(err)
}

export function setLogLevel(level: keyof typeof LogLevels): void {
  logger.level = LogLevels[level]
}

export function logErrorToTelemetry(connection: Connection): void {
  const reporter: ConsolaReporter = {
    log: ({ level, ...logObj }, ctx) => {
      if (level !== LogLevels.error && level !== LogLevels.fatal) {
        return
      }
      const tag = logObj.tag || ''
      const parts = logObj.args.map((arg) => {
        if (arg && typeof arg.stack === 'string') {
          return arg.message + '\n' + arg.stack
        }
        if (typeof arg === 'string') {
          return arg
        }
        return String(arg)
      })
      if (tag) {
        parts.unshift(`[${tag}]`)
      }
      const message = parts.join(' ')
      connection.telemetry.logEvent({ eventName: 'error', error: message })
    }
  }
  root.addReporter(reporter)
  logger.setReporters(root.options.reporters)
}

export function logToLspConnection(connection: Connection): void {
  const reporter: ConsolaReporter = {
    log: ({ level, ...logObj }, ctx) => {
      const tag = logObj.tag || ''
      const parts = logObj.args.map((arg) => {
        if (arg && typeof arg.stack === 'string') {
          return arg.message + '\n' + arg.stack
        }
        if (typeof arg === 'string') {
          return arg
        }
        return String(arg)
      })
      if (tag) {
        parts.unshift(`[${tag}]`)
      }
      const message = parts.join(' ')
      switch (true) {
        case level >= LogLevels.debug: {
          connection.console.debug(message)
          break
        }
        case level >= LogLevels.log: {
          connection.console.info(message)
          break
        }
        case level >= LogLevels.warn: {
          connection.console.warn(message)
          break
        }
        case level >= LogLevels.fatal: {
          connection.console.error(message)
          break
        }
      }
    }
  }
  root.addReporter(reporter)
  logger.setReporters(root.options.reporters)
}
