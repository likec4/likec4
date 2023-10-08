import k from 'picocolors'
import type { LogErrorOptions, LogOptions, Logger } from 'vite'
import { createLogger } from 'vite'

const ERROR = k.bold(k.bgRed(k.white('ERROR')))
const WARN = k.bold(k.yellow('WARN'))
const INFO = k.bold(k.green('INFO'))

export function createLikeC4Logger(prefix: string): Logger {
  const logger = createLogger('info', {
    prefix
  })

  return {
    ...logger,
    info(msg: string, options?: LogOptions) {
      logger.info(`${INFO} ${msg}`, {
        timestamp: true,
        ...options
      })
    },
    warn(msg: string, options?: LogOptions) {
      logger.info(`${WARN} ${msg}`, {
        timestamp: true,
        ...options
      })
    },
    error(msg: string, options?: LogErrorOptions) {
      logger.info(`${ERROR} ${msg}`, {
        timestamp: true,
        ...options
      })
    }
  }
}
