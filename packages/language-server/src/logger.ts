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
  warn(message: unknown) {
    if (typeof message === 'string' || message instanceof Error) {
      console.warn(message)
      return
    }
    const error = normalizeError(message)
    console.warn(`${error.name}: ${error.message}`)
  },
  error(message: unknown) {
    if (typeof message === 'string' || message instanceof Error) {
      console.error(message)
      return
    }
    const error = normalizeError(message)
    console.error(`${error.name}: ${error.message}`, error)
  },
  silent(silent = true) {
    isSilent = silent
  }
}

export type Logger = typeof logger

export function logError(err: unknown): void {
  if (typeof err === 'string') {
    logger.error(err)
    return
  }
  if (err instanceof Error) {
    logger.error(err.stack ?? err.message)
    return
  }
  logger.error(normalizeError(err))
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
