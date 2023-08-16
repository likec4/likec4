import { CustomError } from 'ts-custom-error'
import safeJsonValue from 'safe-json-value'

export interface BaseErrorOptions {
  cause?: unknown
}

/**
 * Base class for all errors in the LikeC4 library.
 */
class BaseError extends CustomError {
  constructor(message: string, options?: BaseErrorOptions) {
    super(message, options)
    // Set name explicitly as minification can mangle class names
    Object.defineProperty(this, 'name', { value: 'BaseError' })
  }
}

/**
 * Unknown error, mosly probably a bug, unhandled case or coming from a third-party library.
 */
class UnknownError extends BaseError {
  constructor(message: string, options?: BaseErrorOptions) {
    super(message, options)
    this.name = 'UnknownError'
    // Set name explicitly as minification can mangle class names
    // Object.defineProperty(this, 'name', { value: 'UnknownError' })
  }
}
class RelationRefError extends BaseError {
  public constructor(message: string, options?: BaseErrorOptions) {
    super(message, options)
    this.name = 'RelationRefError'
    // Set name explicitly as minification can mangle class names
    // Object.defineProperty(this, 'name', { value: 'RelationRefError' })
  }
}

export { BaseError, UnknownError, RelationRefError }

export function normalizeError(e: unknown): BaseError {
  if (e instanceof BaseError) {
    return e
  }
  if (e instanceof Error) {
    return new UnknownError(e.message, { cause: e })
  }
  try {
    const message = typeof e === 'string' ? e : JSON.stringify(safeJsonValue(e))
    throw new UnknownError(message)
  } catch (e) {
    return e as UnknownError
  }
}

export function serializeError(e: unknown) {
  const err = normalizeError(e)
  return {
    name: err.name,
    message: err.message,
    stack: err.stack
  }
}

export function throwUnknownError(e: unknown): never {
  throw normalizeError(e)
}
