import type { BaseErrorOptions } from './_base'
import { BaseError } from './_base'
import safeJsonValue from 'safe-json-value'

export class NonExhaustiveError extends BaseError {
  public constructor(message: string, options?: BaseErrorOptions) {
    super(message, options)
    // Set name explicitly as minification can mangle class names
    Object.defineProperty(this, 'name', { value: 'NonExhaustiveError' })
  }
}

export function nonexhaustive(arg: never): never {
  const value = typeof arg === 'string' ? arg : JSON.stringify(safeJsonValue(arg))
  throw new NonExhaustiveError(`NonExhaustive value: ${value}`)
}
