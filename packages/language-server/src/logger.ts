import { serializeError } from '@likec4/core'

/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
export const logger = {
  debug(message: string) {
    console.debug(message)
  },
  info(message: string) {
    console.info(message)
  },
  warn(message: string | Error | unknown) {
    console.warn(message)
  },
  log(message: string) {
    console.log(message)
  },
  error: (message: string | Error | unknown) => {
    const error = serializeError(message)
    console.error(`${error.name}: ${error.message}\n${error.stack}`)
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
  const error = serializeError(err)
  logger.warn(`${error.name}: ${error.message}\n${error.stack}`)
}
