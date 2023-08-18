import type { BaseErrorOptions } from './_base'
import { BaseError } from './_base'

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
