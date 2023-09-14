import type { BaseErrorOptions } from './_base'
import { BaseError } from './_base'

export class NullableError extends BaseError {
  public constructor(message: string, options?: BaseErrorOptions) {
    super(message, options)
    // Set name explicitly as minification can mangle class names
    Object.defineProperty(this, 'name', { value: 'UnexpectedNullableError' })
  }
}

// Ensure that the value is NonNullable
// Mostly as safer `value!`
export function nonNullable<T>(value: T): T & {} {
  if (typeof value === 'undefined' || value == null) {
    throw new NullableError(`Expected defined value, but received ${value}`)
  }
  return value
}
