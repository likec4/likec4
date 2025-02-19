import {
  type Sink,
  type TextFormatter,
  errorFromLogRecord,
  getMessageOnlyFormatter,
  getTextFormatter,
  loggable,
  logger as root,
} from '@likec4/log'
import type { Connection } from 'vscode-languageserver'

export const logger = root.getChild('server')
// export const logger = root

export function logError(err: unknown): void {
  logger.error(loggable(err))
}

/**
 * Logs an error as warning (not critical)
 */
export function logWarnError(err: unknown): void {
  logger.warn(loggable(err))
}

type LspConnectionSinkProps = {
  /**
   * The text formatter to use.  Defaults to {@link defaultTextFormatter}.
   */
  formatter?: TextFormatter
}

export function getLspConnectionSink(connection: Connection, props?: LspConnectionSinkProps): Sink {
  const format = props?.formatter ?? getTextFormatter({
    format: ({ category, message }) => {
      return `${category} ${message}`
    },
  })
  return (logObj) => {
    try {
      switch (logObj.level) {
        case 'debug':
          connection.console.debug(format(logObj))
          break
        case 'info':
          connection.console.info(format(logObj))
          break
        case 'warning':
          connection.console.warn(format(logObj))
          break
        case 'error':
        case 'fatal': {
          connection.console.error(format(logObj))
          break
        }
      }
    } catch (e) {
      console.error('Error while logging to LSP connection:', e)
    }
  }
}

export function getTelemetrySink(connection: Connection): Sink {
  const messageOnly = getMessageOnlyFormatter()
  return (logObj) => {
    try {
      switch (logObj.level) {
        case 'error':
        case 'fatal': {
          const err = errorFromLogRecord(logObj)
          if (err) {
            connection.telemetry.logEvent({
              eventName: 'error',
              message: `${err.name}: ${err.message}`,
              category: logObj.category.join('.'),
              ...(err.stack && {
                stack: err.stack,
              }),
            })
          } else {
            connection.telemetry.logEvent({
              eventName: 'error',
              message: messageOnly(logObj),
              category: logObj.category.join('.'),
            })
          }
          break
        }
      }
    } catch (e) {
      console.error('Error while logging to LSP connection:', e)
    }
  }
}
