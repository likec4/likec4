import { BaseError } from './_base'
export const InvariantError = BaseError.subclass('InvariantError')

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

// Throws an error if the value is null or undefined
export function nonNullable<T>(value: T): NonNullable<T> {
  invariant(value != null, 'Expected value to exist')
  return value
}
