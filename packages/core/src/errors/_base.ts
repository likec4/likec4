import ModernError from 'modern-errors'

/**
 * Base class for all errors in the LikeC4 library.
 */
export const LikeC4Error = ModernError.subclass('LikeC4Error')

/**
 * Unknown error, mosly probably a bug, unhandled case or coming from a third-party library.
 */
export const UnknownError = LikeC4Error.subclass('UnknownError')
