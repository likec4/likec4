import { rootLogger } from '@likec4/log'
import { hrtime } from 'node:process'
import prettyMilliseconds from 'pretty-ms'
import k from 'tinyrainbow'
import type { LogErrorOptions, LogType } from 'vite'

export const logger = rootLogger.getChild('cli')

const ERROR = k.bold(k.bgRed(k.white('ERROR')))
const WARN = k.bold(k.yellow('WARN'))
const INFO = k.bold(k.green('INFO'))

export function createLikeC4Logger(prefix: string) {
  const logger = rootLogger.getChild(prefix)
  return {
    info(msg: string) {
      logger.info(msg)
    },
    warn(msg: unknown) {
      if (msg instanceof Error) {
        logger.warn(`${k.red(msg.name + ' ' + msg.message)}`, { msg })
        return
      }
      if (typeof msg === 'string') {
        logger.warn(msg)
        return
      }
      logger.warn`${msg}`
    },
    warnOnce(msg: string): void {
      logger.warn(msg)
    },
    error(msg: unknown, options?: LogErrorOptions): void {
      let error = options?.error ?? msg
      if (error instanceof Error) {
        if (msg === error) {
          logger.error(`${k.red(error.name + ' ' + error.message)}`, { error })
          return
        }
        ;``
        logger.error(`${msg}`, { error })
        return
      }
      if (typeof msg === 'string') {
        logger.error(`${k.red(msg)}`)
        return
      }
      logger.error`${msg}`
    },
    clearScreen: function(type: LogType): void {
      // console.clear()
    },
    hasErrorLogged: function(error: any): boolean {
      throw new Error('Function not implemented.')
    },
    hasWarned: false,
  }
}
export type ViteLogger = ReturnType<typeof createLikeC4Logger>

export type Logger = {
  info(msg: string): void
  warn(msg: unknown): void
  error(err: unknown): void
}
const noop = () => void 0
export const NoopLogger: Logger = {
  info: noop,
  warn: noop,
  error: noop,
}

const NS_PER_MS = 1e6

export function inMillis(start: [number, number]) {
  const [seconds, nanoseconds] = hrtime(start)
  const ms = seconds * 1000 + nanoseconds / NS_PER_MS
  return {
    ms,
    pretty: prettyMilliseconds(ms),
  }
}

export function startTimer(log?: Logger) {
  const start = hrtime()
  return {
    stopAndLog(msg = 'done in ') {
      msg = k.green(`${msg}${inMillis(start).pretty}`)
      ;(log || logger).info(msg)
    },
  }
}

import _boxen, { type Options as BoxenOptions } from 'boxen'

export function boxen(text: string, options?: BoxenOptions): void {
  console.log(_boxen(text, {
    padding: 1,
    margin: 1,
    dimBorder: true,
    ...options,
  }))
}
