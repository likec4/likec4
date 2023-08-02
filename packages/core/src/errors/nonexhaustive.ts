import { BaseError } from './_base'

export const NonExhaustiveError = BaseError.subclass('NonExhaustiveError')

export function nonexhaustive(arg: never): never {
  throw new NonExhaustiveError(`NonExhaustive value: ${JSON.stringify(arg)}`)
}
