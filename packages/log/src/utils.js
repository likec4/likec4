"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseStack = void 0;
exports.indent = indent;
exports.loggable = loggable;
exports.wrapError = wrapError;
var merge_error_cause_1 = require("merge-error-cause");
var safe_stringify_1 = require("safe-stringify");
var wrap_error_message_1 = require("wrap-error-message");
/**
 * Split stack string into lines and normalize (e.g. strip file://).
 * @param stack - Error stack string
 * @returns Array of normalized lines
 */
var parseStack = function (stack) {
    var lines = stack
        .split('\n')
        .map(function (l) {
        var replaced = l.trim()
            .replace('file://', '');
        // // Remove c:\Users\<user>... -> @vscode...
        // .replace(/[A-Za-z]:\\Users\\[^\\]+\\/g, '@vscode\\')
        // // Remove /Users/<user>/... -> @vscode/...
        // .replace(/\/Users\/[^/]+\//g, '@vscode/')
        return replaced;
    });
    return lines;
};
exports.parseStack = parseStack;
/**
 * Indent each line of value by the given number of spaces.
 * @param value - String or array of lines to indent
 * @param indentation - Number of spaces (default 2)
 * @returns Indented string
 */
function indent(value, indentation) {
    if (indentation === void 0) { indentation = 2; }
    value = Array.isArray(value) ? value : value.split('\n');
    var prefix = ' '.repeat(indentation);
    return value.map(function (l) { return "".concat(prefix).concat(l); }).join('\n');
}
/**
 * Serialize unknown to a string (Error → message + stack; else safe-stringify).
 * @param error - Caught value (Error, string, or arbitrary object)
 * @returns Human-readable string for logging
 */
function loggable(error) {
    if (typeof error === 'string') {
        return error;
    }
    if (error instanceof Error) {
        var mergedErr = (0, merge_error_cause_1.default)(error);
        if (mergedErr.stack) {
            var stack = (0, exports.parseStack)(mergedErr.stack);
            return mergedErr.message + '\n' + indent(stack.slice(1));
        }
        return mergedErr.message;
    }
    return (0, safe_stringify_1.default)(error, { indentation: '\t' });
}
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
function wrapError(error, newMessage) {
    return (0, wrap_error_message_1.default)(error, newMessage);
}
