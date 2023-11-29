import { normalizeError } from '@likec4/core'
import k from 'picocolors'
import prettyMilliseconds from 'pretty-ms'
import type { LogErrorOptions, LogOptions } from 'vite'
import { createLogger } from 'vite'
import { isCI } from 'ci-info'

const ERROR = k.bold(k.bgRed(k.white('ERROR')))
const WARN = k.bold(k.yellow('WARN'))
const INFO = k.bold(k.green('INFO'))

export function createLikeC4Logger(prefix: string) {
  const logger = createLogger('info', {
    prefix,
    allowClearScreen: !isCI
  })

  const timestamp = !isCI

  return {
    ...logger,
    info(msg: string, options?: LogOptions) {
      logger.info(`${INFO} ${msg}`, {
        timestamp,
        ...options
      })
    },
    warn(msg: string, options?: LogOptions) {
      logger.warn(`${WARN} ${msg}`, {
        timestamp,
        ...options
      })
    },
    error(err: unknown, options?: LogErrorOptions) {
      if (typeof err === 'string') {
        logger.error(`${ERROR} ${err}`, {
          timestamp,
          ...options
        })
        return
      }
      const error = normalizeError(err)
      logger.error(`${ERROR} ${error.stack ?? error.message}`, {
        timestamp,
        error,
        ...options
      })
    }
  }
}
export type Logger = ReturnType<typeof createLikeC4Logger>

const NS_PER_MS = 1e6

export function startTimer(logger: Logger) {
  const start = process.hrtime()
  return {
    stopAndLog(msg = '✓ done in ') {
      const [seconds, nanoseconds] = process.hrtime(start)
      const ms = seconds * 1000 + nanoseconds / NS_PER_MS
      logger.info(k.green(`${msg}${prettyMilliseconds(ms)}`))
    }
  }
}
