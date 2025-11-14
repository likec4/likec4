import { nonexhaustive } from '@likec4/core'
import {
  type Sink,
  type TextFormatter,
  configureLogger as _configureLogger,
  errorFromLogRecord,
  getConsoleSink,
  getMessageOnlyFormatter,
  getTextFormatter,
  loggable,
  rootLogger,
} from '@likec4/log'
import type { TelemetryReporter } from '@vscode/extension-telemetry'
import { defineLogger, toRaw } from 'reactive-vscode'
import vscode from 'vscode'

export const loggerOutput = defineLogger('LikeC4 Extension', {
  outputChannel: vscode.window.createOutputChannel('LikeC4 Extension', {
    log: true,
  }),
})
export const logger = rootLogger.getChild('vscode')

type OutputChannelSinkProps = {
  /**
   * The text formatter to use.  Defaults to {@link defaultTextFormatter}.
   */
  formatter?: TextFormatter
}
function getOutputChannelSink(props?: OutputChannelSinkProps): Sink {
  const format = props?.formatter ?? getTextFormatter({
    format({ category, message }) {
      return `${category} ${message}`
    },
  })
  return (logObj) => {
    try {
      switch (logObj.level) {
        case 'trace':
        case 'debug':
          // toRaw(loggerOutput.outputChannel).
          // if (loggerOutput.outputChannel.value) {
          // }
          loggerOutput.outputChannel ??
            loggerOutput.append(format(logObj).trimEnd())
          break
        case 'info':
          loggerOutput.info(format(logObj).trimEnd())
          break
        case 'warning':
          loggerOutput.warn(format(logObj).trimEnd())
          break
        case 'error':
        case 'fatal':
          loggerOutput.error(format(logObj).trimEnd())
          break
        default:
          nonexhaustive(logObj.level)
      }
    } catch (e) {
      loggerOutput.error(loggable(e))
    }
  }
}

function getTelemetrySink(telemetry: TelemetryReporter): Sink {
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

export function configureLogger(telemetry?: TelemetryReporter) {
  _configureLogger({
    reset: true,
    sinks: {
      console: getConsoleSink(),
      vscode: getOutputChannelSink(),
      ...(telemetry ? { telemetry: getTelemetrySink(telemetry) } : {}),
    },
    loggers: [
      // sends logs to all sinks
      {
        category: 'likec4',
        sinks: ['console', 'vscode'].concat(telemetry ? ['telemetry'] : []),
        lowestLevel: 'debug',
      },
    ],
  })
}
