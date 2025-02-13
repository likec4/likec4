import {
  type Sink,
  type TextFormatter,
  configureLogger as configure,
  errorFromLogRecord,
  getConsoleSink,
  getMessageOnlyFormatter,
  getTextFormatter,
  rootLogger,
} from '@likec4/log'
import type { LogOutputChannel } from 'vscode'
import vscode from 'vscode'
import { ExtensionController } from './ExtensionController'

export const logger = rootLogger.getChild('vscode')

export function logWarn(e: unknown): void {
  if (e instanceof Error) {
    logger.warn`${e}`
    return
  }
  const error = new Error(`Unknown error: ${e}`)
  try {
    Error.captureStackTrace(error, logWarn)
  } catch {
    // ignore
  }
  logger.warn`${error}`
}

export function logError(e: unknown): void {
  if (e instanceof Error) {
    logger.error`${e}`
    return
  }
  const error = new Error(`Unknown error: ${e}`)
  try {
    Error.captureStackTrace(error, logError)
  } catch {
    // ignore
  }
  logger.error`${error}`
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
          channel.debug(format(logObj))
          break
        case 'info':
          channel.info(format(logObj))
          break
        case 'warning':
          channel.warn(format(logObj))
          break
        case 'error':
        case 'fatal':
          channel.error(format(logObj))
          break
      }
    } catch (e) {
      console.error(e)
    }
  }
}

function getTelemetrySink(): Sink {
  const messageOnly = getMessageOnlyFormatter()
  return (logObj) => {
    try {
      switch (logObj.level) {
        case 'error':
        case 'fatal': {
          const telemetry = ExtensionController.telemetry
          if (!telemetry || telemetry.telemetryLevel === 'off') {
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

export async function configureLogger(channel: LogOutputChannel) {
  await configure({
    sinks: {
      console: getConsoleSink(),
      vscode: getOutputChannelSink(channel),
      telemetry: getTelemetrySink(),
    },
    loggers: [
      {
        category: 'likec4',
        sinks: ['console', 'vscode', 'telemetry'],
      },
    ],
  })
}
