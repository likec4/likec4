import {
  type Sink,
  type TextFormatter,
  configureLogger as configure,
  getConsoleSink,
  getTextFormatter,
  rootLogger,
} from '@likec4/log'
import type { LogOutputChannel } from 'vscode'

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

export async function configureLogger(channel: LogOutputChannel) {
  await configure({
    sinks: {
      console: getConsoleSink(),
      vscode: getOutputChannelSink(channel),
    },
    loggers: [
      {
        category: 'likec4',
        sinks: ['console', 'vscode'],
      },
    ],
  })
}

// export const lspErrorHandler: ErrorHandler = {
//   error(error: Error, message: string, count: number): void {
//     logError(error)
//   },
//   closed(): void {
//     // ignore
//   },
// }
