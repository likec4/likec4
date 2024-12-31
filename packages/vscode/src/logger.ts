import { nonexhaustive } from '@likec4/core'
import { type ConsolaReporter, formatLogObj, logger } from '@likec4/log'
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
  return addLogReporter((logObj, _ctx) => {
    const { message } = formatLogObj(logObj)
    switch (logObj.type) {
      case 'silent': {
        // ignore
        break
      }
      case 'verbose':
      case 'trace': {
        channel.trace(message)
        break
      }
      case 'debug':
      case 'log': {
        channel.debug(message)
        break
      }
      case 'info':
      case 'box':
      case 'ready':
      case 'start':
      case 'success': {
        channel.info(message)
        break
      }
      case 'warn': {
        channel.warn(message)
        break
      }
      case 'fail':
      case 'error':
      case 'fatal': {
        channel.error(message)
        break
      }
      default:
        nonexhaustive(logObj.type)
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
