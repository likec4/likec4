/**
 * Split stack string into lines and normalize (e.g. strip file://).
 * @param stack - Error stack string
 * @returns Array of normalized lines
 */
export declare const parseStack: (stack: string) => string[];
/**
 * Indent each line of value by the given number of spaces.
 * @param value - String or array of lines to indent
 * @param indentation - Number of spaces (default 2)
 * @returns Indented string
 */
export declare function indent(value: string | string[], indentation?: number): string;
/**
 * Serialize unknown to a string (Error → message + stack; else safe-stringify).
 * @param error - Caught value (Error, string, or arbitrary object)
 * @returns Human-readable string for logging
 */
export declare function loggable(error: unknown): string;
type NormalizeError<ErrorArg> = ErrorArg extends Error ? ErrorArg : Error;
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
export declare function wrapError<ErrorArg>(error: ErrorArg, newMessage: string): NormalizeError<ErrorArg>;
export {};
