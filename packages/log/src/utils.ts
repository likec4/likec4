import mergeErrorCause from 'merge-error-cause'
import safeStringify from 'safe-stringify'
import wrapErrorMessage from 'wrap-error-message'

/**
 * Split stack string into lines and normalize (e.g. strip file://).
 * @param stack - Error stack string
 * @returns Array of normalized lines
 */
export const parseStack = (stack: string): string[] => {
  const lines = stack
    .split('\n')
    .map((l) => {
      let replaced = l.trimEnd()
        .replace('file://', '')
        // Remove C:\Users\...
        .replace(/[A-Za-z]:\\Users\\[^\\]+\\/i, '@vscode\\')
        // Remove /Users/... -> @vscode/...
        .replace(/\/Users\/[^/]+\//, '@vscode/')
      return replaced
    })
  return lines
}

/**
 * Indent each line of value by the given number of spaces.
 * @param value - String or array of lines to indent
 * @param indentation - Number of spaces (default 2)
 * @returns Indented string
 */
export function indent(value: string | string[], indentation: string | number = 2): string {
  value = Array.isArray(value) ? value : value.split('\n')
  const prefix = typeof indentation === 'string' ? indentation : ' '.repeat(indentation)
  return value.map((l) => `${prefix}${l}`).join('\n')
}

/**
 * Serialize unknown to a string (Error → message + stack; else safe-stringify).
 * @param error - Caught value (Error, string, or arbitrary object)
 * @returns Human-readable string for logging
 */
export function loggable(error: unknown): string {
  if (typeof error === 'string') {
    return error
  }
  if (isError(error)) {
    const mergedErr = mergeErrorCause(error)
    if (mergedErr.stack) {
      const stack = parseStack(mergedErr.stack)
      return mergedErr.message + '\n' + indent(stack.slice(1), '\t')
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

export function isError(error: unknown): error is Error {
  return error instanceof Error
}
