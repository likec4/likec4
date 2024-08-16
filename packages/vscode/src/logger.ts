import { type ConsolaReporter, LogLevels, rootLogger } from '@likec4/log'
import type { Disposable, LogOutputChannel } from 'vscode'
import { disposable } from './util'

export const logger = rootLogger.withTag('vscode')

export function addLogReporter(log: ConsolaReporter['log']): Disposable {
  const reporter = { log }
  rootLogger.addReporter(reporter)
  logger.setReporters(rootLogger.options.reporters)
  return disposable(() => {
    rootLogger.removeReporter(reporter)
    logger.setReporters(rootLogger.options.reporters)
  })
}
export function logToChannel(channel: LogOutputChannel): Disposable {
  return addLogReporter(({ level, message, ...logObj }, ctx) => {
    const tag = logObj.tag || ''
    const parts = logObj.args.map((arg) => {
      if (arg && typeof arg.stack === 'string') {
        return arg.message + '\n' + arg.stack
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
      case level >= LogLevels.log: {
        channel.info(msg, ...parts.slice(1))
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
