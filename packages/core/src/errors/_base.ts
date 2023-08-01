import ModernError from 'modern-errors'

/**
 * Base class for all errors in the LikeC4 library.
 */
export const BaseError = ModernError.subclass('BaseError')

/**
 * Unknown error, mosly probably a bug, unhandled case or coming from a third-party library.
 */
export const UnknownError = BaseError.subclass('UnknownError')

export const UnexhaustiveError = BaseError.subclass('UnexhaustiveError')

export const RelationRefError = BaseError.subclass('RelationRefError')
