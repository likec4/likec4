import {
  type Logger,
  type Sink,
  errorFromLogRecord,
  getMessageOnlyFormatter,
  loggable,
  logger as root,
} from '@likec4/log'
import type { Connection } from 'vscode-languageserver'

export const logger: Logger = root.getChild('server')

export {
  logger as serverLogger,
}

/**
 * Logs an error as warning (not critical)
 */
export function logWarnError(err: unknown): void {
  logger.warn(loggable(err))
}

export function getTelemetrySink(connection: Connection): Sink {
  const messageOnly = getMessageOnlyFormatter()
  return (logObj) => {
    try {
      switch (logObj.level) {
        case 'error':
        case 'fatal': {
          const category = logObj.category.join('.')
          if (category === 'likec4.config') {
            break
          }

          const err = errorFromLogRecord(logObj)
          if (err) {
            connection.telemetry.logEvent({
              eventName: 'error',
              message: `${err.name}: ${err.message}`,
              category,
              ...(err.stack && {
                stack: err.stack,
              }),
            })
          } else {
            connection.telemetry.logEvent({
              eventName: 'error',
              message: messageOnly(logObj),
              category,
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
