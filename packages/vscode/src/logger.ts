import { type ConsolaReporter, logger, LogLevels } from '@likec4/log'
import { isError } from 'remeda'
import type { Disposable, LogOutputChannel } from 'vscode'
import { disposable } from './util'

export { logger }

export function addLogReporter(log: ConsolaReporter['log']): Disposable {
  const reporter = { log }
  logger.addReporter(reporter)
  return disposable(() => {
    logger.removeReporter(reporter)
  })
}
export function logToChannel(channel: LogOutputChannel): Disposable {
  return addLogReporter(({ level, message, ...logObj }, ctx) => {
    const tag = logObj.tag || ''
    const parts = logObj.args.map((arg) => {
      if (isError(arg)) {
        return arg.stack ?? arg.message
      }
      return arg
    })
    const msg = tag ? `${tag} ${parts[0]}` : parts[0]
    switch (true) {
      case level >= LogLevels.trace: {
        channel.trace(msg, ...parts.slice(1))
        break
      }
      case level >= LogLevels.debug: {
        channel.debug(msg, ...parts.slice(1))
        break
      }
      case level >= LogLevels.info: {
        channel.info(msg, ...parts.slice(1))
        break
      }
      case level >= LogLevels.log: {
        channel.debug(msg, ...parts.slice(1))
        break
      }
      case level >= LogLevels.warn: {
        channel.warn(msg, ...parts.slice(1))
        break
      }
      case level >= LogLevels.fatal: {
        channel.error(msg, ...parts.slice(1))
        break
      }
    }
  })
}

export function logWarn(e: unknown): void {
  if (e instanceof Error) {
    logger.warn(e)
    return
  }
  const error = new Error(`Unknown error: ${e}`)
  try {
    Error.captureStackTrace(error, logWarn)
  } catch {
    // ignore
  }
  logger.warn(error)
}

export function logError(e: unknown): void {
  if (e instanceof Error) {
    logger.error(e)
    return
  }
  const error = new Error(`Unknown error: ${e}`)
  try {
    Error.captureStackTrace(error, logError)
  } catch {
    // ignore
  }
  logger.error(error)
}
