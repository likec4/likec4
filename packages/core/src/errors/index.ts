import { CustomError } from 'ts-custom-error'
import stringify from 'safe-stable-stringify'
import { isString } from '../utils'

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

export class InvalidArgError extends BaseError {
  constructor(message: string, options?: BaseErrorOptions) {
    super(message, options)
    // Set name explicitly as minification can mangle class names
    Object.defineProperty(this, 'name', { value: 'InvalidArgError' })
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

export class NullableError extends BaseError {
  public constructor(message: string, options?: BaseErrorOptions) {
    super(message, options)
    // Set name explicitly as minification can mangle class names
    Object.defineProperty(this, 'name', { value: 'NullableError' })
  }
}

export class InvariantError extends BaseError {
  public constructor(message: string, options?: BaseErrorOptions) {
    super(message, options)
    // Set name explicitly as minification can mangle class names
    Object.defineProperty(this, 'name', { value: 'InvariantError' })
  }
}

// Ensure that the value is NonNullable
// Mostly as safer `value!`
export function nonNullable<T>(value: T, message?: string): T & {} {
  if (typeof value === 'undefined' || value == null) {
    throw new NullableError(message ?? `Expected defined value, but received ${value}`)
  }
  return value
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
  if (e === null || e === undefined) {
    return new UnknownError('Undefined error')
  }
  const message = isString(e) ? e : stringify(e as object)
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

// Throw an error if the condition fails
// > Not providing an inline default argument for message as the result is smaller
export function invariant(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  condition: any,
  // Can provide a string, or a function that returns a string for cases where
  // the message takes a fair amount of effort to compute
  message?: string
): asserts condition {
  if (condition) {
    return
  }
  throw new InvariantError(message ?? 'Invariant failed')
}

export class NonExhaustiveError extends BaseError {
  public constructor(message: string, options?: BaseErrorOptions) {
    super(message, options)
    // Set name explicitly as minification can mangle class names
    Object.defineProperty(this, 'name', { value: 'NonExhaustiveError' })
  }
}

export function nonexhaustive(value: never): never {
  const val = typeof value === 'string' ? value : stringify(value as object)
  throw new NonExhaustiveError(`NonExhaustive value: ${val}`)
}

export class InvalidModelError extends BaseError {
  public constructor(message: string, options?: BaseErrorOptions) {
    super(message, options)
    // Set name explicitly as minification can mangle class names
    Object.defineProperty(this, 'name', { value: 'InvalidModelError' })
  }
}

export function ensureModel(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  condition: any,
  // Can provide a string, or a function that returns a string for cases where
  // the message takes a fair amount of effort to compute
  message?: string
): asserts condition {
  if (condition) {
    return
  }
  throw new InvalidModelError(message ?? 'ModelIndex Invariant failed')
}
