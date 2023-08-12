import { BaseError } from './_base'

export const UnexpectedNullableError = BaseError.subclass('UnexpectedNullableError')

// Ensure that the value is NonNullable
// Mostly as safer `value!`
export function nonNullable<T>(value: T): NonNullable<T> {
  if (value == null) {
    throw new UnexpectedNullableError('Expected value to not be null or undefined')
  }
  return value
}
