import ModernError from 'modern-errors'

export const LikeC4Error = ModernError.subclass('LikeC4Error')
export const InvariantError = LikeC4Error.subclass('InvariantError')

// Throw an error if the condition fails
// > Not providing an inline default argument for message as the result is smaller
export function invariant(
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

export const UnknownError = LikeC4Error.subclass('UnknownError')
