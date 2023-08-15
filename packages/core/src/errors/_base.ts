import ModernError from 'modern-errors'
import modernErrorsSerialize, { type ErrorObject } from 'modern-errors-serialize'
import type { ErrorInstance } from 'modern-errors'

/**s
 * Base class for all errors in the LikeC4 library.
 */
export const BaseError = ModernError.subclass('BaseError', {
  plugins: [modernErrorsSerialize]
})

/**
 * Unknown error, mosly probably a bug, unhandled case or coming from a third-party library.
 */
export const UnknownError = BaseError.subclass('UnknownError')

export const RelationRefError = BaseError.subclass('RelationRefError')

export function normalizeError(e: unknown): ErrorInstance {
  return BaseError.normalize(e, UnknownError)
}

export function serializeError(e: unknown): ErrorObject {
  return BaseError.serialize(normalizeError(e))
}

export function throwUnknownError(e: unknown): never {
  throw BaseError.normalize(e, UnknownError)
}
