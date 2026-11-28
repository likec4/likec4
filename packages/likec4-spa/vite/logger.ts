import type { LogErrorOptions, LogType } from 'vite'
import { rootLogger } from '@likec4/log'
import k from 'tinyrainbow'

/**
 * Creates a logger instance compatible with Vite's config.logger (info, warn, error, debug, etc.).
 * @param prefix - Category or tuple of categories for log output (e.g. 'vite' or ['vite', 'react']).
 * @returns Logger object suitable for customLogger in Vite InlineConfig.
 */
export function createViteLogger(prefix: string | readonly [string, ...string[]]) {
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
    hasErrorLogged: function(_error: Error): boolean {
      return false
    },
    hasWarned: false,
  }
}
/** Full logger from createViteLogger; debug and hasErrorLogged are optional so Vite's config.logger is assignable. */
export type ViteLogger =
  & Omit<
    ReturnType<typeof createViteLogger>,
    'debug' | 'hasErrorLogged'
  >
  & {
    debug?: (msg: string, ...args: unknown[]) => void
    hasErrorLogged?: (error: Error) => boolean
  }
