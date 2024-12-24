import { nonexhaustive } from '@likec4/core'
import { type ConsolaReporter, formatLogObj, LogLevels, rootLogger as root } from '@likec4/log'
import { BROWSER } from 'esm-env'
import type { Connection } from 'vscode-languageserver'

export const logger = root.withTag('lsp')
// export const logger = root

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

export function logToLspConnection(connection: Connection): void {
  const reporter: ConsolaReporter = {
    log: (logObj, _ctx) => {
      const { message, error } = formatLogObj(logObj)
      switch (logObj.type) {
        case 'silent': {
          // ignore
          break
        }
        case 'verbose':
        case 'trace': {
          connection.tracer.log(message)
          break
        }
        case 'debug': {
          connection.console.debug(message)
          break
        }
        case 'log': {
          connection.console.log(message)
          break
        }
        case 'info':
        case 'box':
        case 'ready':
        case 'start':
        case 'success': {
          connection.console.info(message)
          break
        }
        case 'warn': {
          connection.console.warn(message)
          break
        }
        case 'fail':
        case 'error':
        case 'fatal': {
          connection.console.error(message)
          if (error) {
            connection.telemetry.logEvent({ eventName: 'error', ...error })
          } else {
            connection.telemetry.logEvent({ eventName: 'error', message })
          }
          break
        }
        default:
          nonexhaustive(logObj.type)
      }
    },
  }
  if (BROWSER) {
    root.addReporter(reporter)
  } else {
    root.setReporters([reporter])
  }
  logger.setReporters(root.options.reporters)
}
