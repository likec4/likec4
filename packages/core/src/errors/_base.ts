import { CustomError } from 'ts-custom-error'
import stringify from 'safe-stable-stringify'

export interface BaseErrorOptions {
  cause?: unknown
}

/**
 * Base class for all errors in the LikeC4 library.
 */
export class BaseError extends CustomError {
  constructor(message: string, options?: BaseErrorOptions) {
    super(message, options)
    // Set name explicitly as minification can mangle class names
    Object.defineProperty(this, 'name', { value: 'BaseError' })
  }
}

/**
 * Unknown error, mosly probably a bug, unhandled case or coming from a third-party library.
 */
export class UnknownError extends BaseError {
  constructor(message: string, options?: BaseErrorOptions) {
    super(message, options)
    // Set name explicitly as minification can mangle class names
    Object.defineProperty(this, 'name', { value: 'UnknownError' })
  }
}

export class RelationRefError extends BaseError {
  public constructor(message: string, options?: BaseErrorOptions) {
    super(message, options)
    // Set name explicitly as minification can mangle class names
    Object.defineProperty(this, 'name', { value: 'RelationRefError' })
  }
}

export function normalizeError(e: unknown): BaseError {
  if (e instanceof BaseError) {
    return e
  }
  if (e instanceof Error) {
    return new UnknownError(e.message, { cause: e })
  }
  const message = typeof e === 'string' ? e : stringify(e as object)
  return new UnknownError(message)
}

export function serializeError(e: unknown) {
  const error = normalizeError(e)
  return {
    name: error.name,
    message: error.stack ? error.stack : `${error.name}: ${error.message}`,
    error
  }
}

export function throwNormalizedError(e: unknown): never {
  throw normalizeError(e)
}
