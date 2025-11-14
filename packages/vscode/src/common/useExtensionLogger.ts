import { loggable } from '@likec4/log'
import { createSingletonComposable, toValue } from 'reactive-vscode'
import { logger as _logger, loggerOutput } from '../logger'

export const useExtensionLogger = (prefix?: string) => {
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
    loggerOutput: toValue(loggerOutput.logger)!,
    logWarn,
    logError,
  }
}
