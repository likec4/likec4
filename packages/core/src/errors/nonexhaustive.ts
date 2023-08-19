import stringify from 'safe-stable-stringify'
import type { BaseErrorOptions } from './_base'
import { BaseError } from './_base'

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
