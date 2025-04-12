import {
  type Sink,
  type TextFormatter,
  errorFromLogRecord,
  getMessageOnlyFormatter,
  getTextFormatter,
  loggable,
  rootLogger,
} from '@likec4/log'
import type TelemetryReporter from '@vscode/extension-telemetry'
import { defineLogger } from 'reactive-vscode'
import type { LogOutputChannel } from 'vscode'
import vscode from 'vscode'

export const logger = rootLogger.getChild('vscode')

export const vscodelogger = defineLogger('vscode')

export function logWarn(e: unknown): void {
  if (e instanceof Error) {
    logger.warn(loggable(e))
    return
  }
  const error = new Error(`Unknown error: ${e}`)
  try {
    Error.captureStackTrace(error, logWarn)
  } catch {
    // ignore
  }
  logger.warn(loggable(error))
}

export function logError(e: unknown): void {
  if (e instanceof Error) {
    logger.error(loggable(e))
    return
  }
  const error = new Error(`Unknown error: ${e}`)
  try {
    Error.captureStackTrace(error, logError)
  } catch {
    // ignore
  }
  logger.error(loggable(error))
}

type OutputChannelSinkProps = {
  /**
   * The text formatter to use.  Defaults to {@link defaultTextFormatter}.
   */
  formatter?: TextFormatter
}
export function getOutputChannelSink(channel: LogOutputChannel, props?: OutputChannelSinkProps): Sink {
  const format = props?.formatter ?? getTextFormatter({
    format({ category, message }) {
      return `${category} ${message}`
    },
  })
  return (logObj) => {
    try {
      switch (logObj.level) {
        case 'debug':
          channel.debug(format(logObj).trimEnd())
          break
        case 'info':
          channel.info(format(logObj).trimEnd())
          break
        case 'warning':
          channel.warn(format(logObj).trimEnd())
          break
        case 'error':
        case 'fatal':
          channel.error(format(logObj).trimEnd())
          break
      }
    } catch (e) {
      channel.error(loggable(e))
    }
  }
}

export function getTelemetrySink(telemetry: TelemetryReporter): Sink {
  const messageOnly = getMessageOnlyFormatter()
  return (logObj) => {
    try {
      switch (logObj.level) {
        case 'error':
        case 'fatal': {
          if (telemetry.telemetryLevel === 'off') {
            return
          }
          const err = errorFromLogRecord(logObj)
          if (err) {
            const error: Record<string, any> = {
              message: new vscode.TelemetryTrustedValue(`${err.name}: ${err.message}`),
              category: logObj.category.join('.'),
            }
            if ('stack' in err) {
              error['stack'] = new vscode.TelemetryTrustedValue(err.stack) as any as string
            }
            telemetry.sendTelemetryErrorEvent('error', error)
          } else {
            telemetry.sendTelemetryErrorEvent('error', {
              message: new vscode.TelemetryTrustedValue(messageOnly(logObj)),
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
