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
import { createSingletonComposable } from 'reactive-vscode'
import vscode, { type LogOutputChannel } from 'vscode'

let outputChannel: LogOutputChannel | undefined
function getOutput(): LogOutputChannel {
  return outputChannel ??= vscode.window.createOutputChannel('LikeC4 Extension', {
    log: true,
  })
}

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
    const output = getOutput()
    try {
      switch (logObj.level) {
        case 'trace':
        case 'debug':
          output.debug(format(logObj).trimEnd())
          break
        case 'info':
          output.info(format(logObj).trimEnd())
          break
        case 'warning':
          output.warn(format(logObj).trimEnd())
          break
        case 'error':
        case 'fatal':
          output.error(format(logObj).trimEnd())
          break
        default:
          nonexhaustive(logObj.level)
      }
    } catch (e) {
      output.error(loggable(e))
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
      getOutput().error('Error while logging to LSP connection:', e)
    }
  }
}

function configureLogger(telemetry?: TelemetryReporter) {
  try {
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
  } catch (e) {
    getOutput().error(e as any)
  }
}

export const useConfigureLogger = createSingletonComposable(() => {
  const output = getOutput()
  output.trace('Initializing extension logger')
  const logger = rootLogger.getChild('vscode')

  configureLogger()

  return {
    output,
    logger,
    configureLogger,
  }
})

export function useExtensionLogger(prefix?: string) {
  const { logger: _logger, output } = useConfigureLogger()
  let logger = prefix ? _logger.getChild(prefix) : _logger

  function logWarn(e: unknown): void {
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

  function logError(e: unknown): void {
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

  return {
    logger,
    output,
    logWarn,
    logError,
  }
}
