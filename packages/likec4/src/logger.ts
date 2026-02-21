import { rootLogger } from '@likec4/log'
import _boxen, { type Options as BoxenOptions } from 'boxen'
import { hrtime } from 'node:process'
import prettyMilliseconds from 'pretty-ms'
import type { RollupError } from 'rollup'
import k from 'tinyrainbow'
import type { LogErrorOptions, LogType } from 'vite'

/** Root CLI logger (e.g. for likec4 start, export). */
export const logger = rootLogger.getChild('cli')

/**
 * Creates a logger instance compatible with Vite's config.logger (info, warn, error, debug, etc.).
 * @param prefix - Category or tuple of categories for log output (e.g. 'vite' or ['vite', 'react']).
 * @returns Logger object suitable for customLogger in Vite InlineConfig.
 */
export function createLikeC4Logger(prefix: string | readonly [string, ...string[]]) {
  const logger = rootLogger.getChild(prefix)
  return {
    info(msg: string) {
      logger.info(msg)
    },
    /** Logs a debug-level message; optional variadic args are attached as an args object. */
    debug(msg: string, ...args: unknown[]): void {
      if (args.length === 0) logger.debug(msg)
      else logger.debug(msg, { args })
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
    /**
     * Log an error. msg: string or Error (displayed); options?.error: Error to attach (for stack).
     * If msg === options?.error, logs error name+message; else logs msg and attaches error.
     */
    error(msg: unknown, options?: LogErrorOptions): void {
      let error = options?.error ?? msg
      if (error instanceof Error) {
        if (msg === error) {
          logger.error(`${k.red(error.name + ' ' + error.message)}`, { error })
          return
        }
        logger.error(k.red(msg), { error })
        return
      }
      if (typeof msg === 'string') {
        logger.error(k.red(msg))
        return
      }
      logger.error`${msg}`
    },
    clearScreen: function(_type: LogType): void {
      // console.clear()
    },
    /** Not implemented; callers should not rely on this. Returns false. */
    hasErrorLogged: function(_error: Error | RollupError): boolean {
      return false
    },
    hasWarned: false,
  }
}
/** Full logger from createLikeC4Logger; debug and hasErrorLogged are optional so Vite's config.logger is assignable. */
export type ViteLogger =
  & Omit<
    ReturnType<typeof createLikeC4Logger>,
    'debug' | 'hasErrorLogged'
  >
  & {
    debug?: (msg: string, ...args: unknown[]) => void
    hasErrorLogged?: (error: Error | RollupError) => boolean
  }

/** Minimal logger interface (info, warn, error only). */
export type Logger = {
  info(msg: string): void
  warn(msg: unknown): void
  error(err: unknown): void
}
const noop = () => void 0
/** Logger that does nothing (e.g. when logging is disabled). */
export const NoopLogger: Logger = {
  info: noop,
  warn: noop,
  error: noop,
}

const NS_PER_MS = 1e6

/**
 * Converts an hrtime tuple to milliseconds and a human-readable string.
 * @param start - Tuple from process.hrtime() or hrtime().
 * @returns Object with ms (number) and pretty (string, e.g. "1.2s").
 */
export function inMillis(start: [number, number]) {
  const [seconds, nanoseconds] = hrtime(start)
  const ms = seconds * 1000 + nanoseconds / NS_PER_MS
  return {
    ms,
    pretty: prettyMilliseconds(ms),
  }
}

/**
 * Starts a timer; call stopAndLog() to log elapsed time.
 * @param log - Optional logger; if omitted, uses the root CLI logger.
 * @returns Object with stopAndLog(msg?) to log elapsed time.
 */
export function startTimer(log?: Logger) {
  const start = hrtime()
  return {
    stopAndLog(msg = 'done in ') {
      msg = k.green(`${msg}${inMillis(start).pretty}`)
      ;(log || logger).info(msg)
    },
  }
}

/** Prints text in a bordered box to stdout (e.g. for server URLs). */
export function boxen(text: string, options?: BoxenOptions): void {
  console.log(_boxen(text, {
    padding: 1,
    margin: 1,
    dimBorder: true,
    ...options,
  }))
}
