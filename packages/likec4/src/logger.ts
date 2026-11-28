import type { Options as BoxenOptions } from 'boxen'
import { hrtime } from 'node:process'
import { rootLogger } from '@likec4/log'
import _boxen from 'boxen'
import prettyMilliseconds from 'pretty-ms'
import k from 'tinyrainbow'

/** Root CLI logger (e.g. for likec4 start, export). */
export const logger = rootLogger.getChild('cli')

export { createViteLogger as createLikeC4Logger, type ViteLogger } from '@likec4/spa/vite/logger'

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
