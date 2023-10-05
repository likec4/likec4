import type { LogErrorOptions, LogOptions, Logger } from 'vite'
import { createLogger } from 'vite'
import k from 'kleur'

const ERROR = k.red().bold('ERROR')
const WARN = k.yellow().bold('WARN')
const INFO = k.green().bold('INFO')

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
