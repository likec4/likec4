/* eslint-disable @typescript-eslint/no-explicit-any */
import { normalizeError, serializeError } from '@likec4/core'

/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
export const logger = {
  debug(message: string) {
    console.debug(message)
  },
  info(message: string) {
    console.info(message)
  },
  warn(message: string | Error) {
    console.warn(message)
  },
  log(message: string) {
    console.log(message)
  },
  error(message: any) {
    if (typeof message === 'string') {
      console.error(message)
      return
    }
    console.error(normalizeError(message))
  },
  trace(message: string) {
    console.debug(message)
  }
}

export type Logger = typeof logger

export function logError(error: Error | unknown): void {
  logger.error(error)
}

export function logWarnError(err: Error | unknown): void {
  logger.warn(serializeError(err).error)
}
