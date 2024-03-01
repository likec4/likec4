/* eslint-disable @typescript-eslint/no-explicit-any */
import { normalizeError } from '@likec4/core'

/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
let isSilent = false

export const logger = {
  trace(message: string) {
    if (isSilent) return
    console.trace(message)
  },
  debug(message: string) {
    if (isSilent) return
    console.debug(message)
  },
  info(message: string) {
    if (isSilent) return
    console.info(message)
  },
  warn(message: string) {
    if (isSilent) return
    console.warn(message)
  },
  error(message: any) {
    if (isSilent) return
    if (typeof message === 'string') {
      console.error(message)
      return
    }
    console.error(normalizeError(message))
  },
  silent(silent = true) {
    isSilent = silent
  }
}

export type Logger = typeof logger

export function logError(error: unknown): void {
  logger.error(error)
}

export function logWarnError(err: unknown): void {
  if (typeof err === 'string') {
    logger.warn(err)
    return
  }
  if (err instanceof Error) {
    logger.warn(err.stack ?? err.message)
    return
  }
  const error = normalizeError(err)
  logger.warn(`${error.name}: ${error.message}`)
}
