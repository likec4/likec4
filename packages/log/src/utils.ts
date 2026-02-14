import mergeErrorCause from 'merge-error-cause'
import safeStringify from 'safe-stringify'
import wrapErrorMessage from 'wrap-error-message'

export const parseStack = (stack: string): string[] => {
  const lines = stack
    .split('\n')
    .map((l) => {
      let replaced = l.trim()
        .replace('file://', '')
      // // Remove c:\Users\<user>... -> @vscode...
      // .replace(/[A-Za-z]:\\Users\\[^\\]+\\/g, '@vscode\\')
      // // Remove /Users/<user>/... -> @vscode/...
      // .replace(/\/Users\/[^/]+\//g, '@vscode/')
      return replaced
    })
  return lines
}

export function indent(value: string | string[], indentation = 2): string {
  value = Array.isArray(value) ? value : value.split('\n')
  const prefix = ' '.repeat(indentation)
  return value.map((l) => `${prefix}${l}`).join('\n')
}

export function loggable(error: unknown): string {
  if (typeof error === 'string') {
    return error
  }
  if (error instanceof Error) {
    const mergedErr = mergeErrorCause(error)
    if (mergedErr.stack) {
      const stack = parseStack(mergedErr.stack)
      return mergedErr.message + '\n' + indent(stack.slice(1))
    }
    return mergedErr.message
  }
  return safeStringify(error, { indentation: '\t' })
}

type NormalizeError<ErrorArg> = ErrorArg extends Error ? ErrorArg : Error

/**
 * Appends `message` to `error.message`. If `message` ends with `:` or `:\n`,
 * prepends it instead.
 *
 * Returns `error`. If `error` is not an `Error` instance, it is converted to
 * one.
 *
 * @example
 * ```js
 * wrapErrorMessage(new Error('Message.'), 'Additional message.')
 * // Error: Message.
 * // Additional message.
 *
 * wrapErrorMessage(new Error('Message.'), 'Additional message:')
 * // Error: Additional message: Message.
 *
 * wrapErrorMessage(new Error('Message.'), 'Additional message:\n')
 * // Error: Additional message:
 * // Message.
 *
 * wrapErrorMessage(new Error('Message.'), '')
 * // Error: Message.
 *
 * const invalidError = 'Message.'
 * wrapErrorMessage(invalidError, 'Additional message.')
 * // Error: Message.
 * // Additional message.
 *
 * wrapErrorMessage(new Error('  Message with spaces  '), '  Additional message  ')
 * // Error: Message with spaces
 * // Additional message
 * ```
 */
export function wrapError<ErrorArg>(error: ErrorArg, newMessage: string): NormalizeError<ErrorArg> {
  return wrapErrorMessage(error, newMessage)
}
