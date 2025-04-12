// Ensure that the value is NonNullable
// Mostly as safer `value!`
// eslint-disable-next-line @typescript-eslint/ban-types
export function nonNullable<T>(value: T, message?: string | (() => string)): NonNullable<T> {
  if (typeof value === 'undefined' || value == null) {
    const msg = typeof message === 'function' ? message() : message
    throw new Error(msg ?? `Expected defined value, but received ${value}`)
  }
  return value
}

// Throw an error if the condition fails
// > Not providing an inline default argument for message as the result is smaller
export function invariant(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  condition: any,
  // Can provide a string, or a function that returns a string for cases where
  // the message takes a fair amount of effort to compute
  message?: string,
): asserts condition {
  if (condition) {
    return
  }
  throw new Error(message ?? 'Invariant failed')
}

export function nonexhaustive(value: never): never {
  throw new Error(`NonExhaustive value: ${value}`)
}
