"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorFromLogRecord = errorFromLogRecord;
exports.appendErrorToMessage = appendErrorToMessage;
exports.getMessageOnlyFormatter = getMessageOnlyFormatter;
exports.getTextFormatter = getTextFormatter;
exports.getAnsiColorFormatter = getAnsiColorFormatter;
exports.getConsoleFormatter = getConsoleFormatter;
var logtape_1 = require("@logtape/logtape");
var merge_error_cause_1 = require("merge-error-cause");
var wrap_error_message_1 = require("wrap-error-message");
var utils_1 = require("./utils");
function getErrorFromLogRecord(record) {
    var errors = Object
        .entries(record.properties)
        .flatMap(function (_a) {
        var k = _a[0], err = _a[1];
        if (err instanceof Error) {
            var mergedErr = (0, merge_error_cause_1.default)(err);
            if (mergedErr.stack) {
                mergedErr.stack = (0, utils_1.parseStack)(mergedErr.stack).join('\n');
            }
            return [mergedErr];
        }
        if (k === 'error' || k === 'err') {
            return [new Error((0, utils_1.loggable)(err))];
        }
        return [];
    });
    if (errors.length === 0) {
        return null;
    }
    return errors.length === 1 ? errors[0] : new AggregateError(errors);
}
/**
 * Extract a single Error from a log record (from properties or rawMessage).
 * @param record - Log record that may contain error in properties or rawMessage
 * @returns Merged/wrapped Error or null if none found
 */
function errorFromLogRecord(record) {
    var error = getErrorFromLogRecord(record);
    if (error && typeof record.rawMessage === 'string') {
        return (0, wrap_error_message_1.default)(error, record.rawMessage + '\n');
    }
    return error;
}
/**
 * Append error from record properties to the formatted message (optionally colored).
 * @param values - Formatted values (record + message)
 * @param color - When true, wrap error text in ANSI red
 * @returns Updated FormattedValues with error appended to message
 */
function appendErrorToMessage(values, color) {
    if (color === void 0) { color = false; }
    var error = getErrorFromLogRecord(values.record);
    if (error) {
        var errorMessge = error.message;
        if (error.stack) {
            errorMessge = errorMessge + '\n' + (0, utils_1.indent)(error.stack.split('\n').slice(1));
        }
        if (color) {
            errorMessge = "".concat(ansiColors.red).concat(errorMessge).concat(RESET);
        }
        return __assign(__assign({}, values), { message: values.message + '\n' + (0, utils_1.indent)(errorMessge) });
    }
    return values;
}
var levelAbbreviations = {
    'trace': 'TRACE',
    'debug': 'DEBUG',
    'info': 'INFO ',
    'warning': 'WARN ',
    'error': 'ERROR',
    'fatal': 'FATAL',
};
/**
 * Formatter that outputs only the log message (no timestamp/level/category).
 * @returns TextFormatter that returns just the message string
 */
function getMessageOnlyFormatter() {
    return getTextFormatter({
        format: function (_a) {
            var message = _a.message;
            return message;
        },
    });
}
var level = function (l) { return levelAbbreviations[l]; };
/**
 * Build a text formatter with optional custom format; appends error from record.
 * @param options - Optional format and logtape options
 * @returns TextFormatter
 */
function getTextFormatter(options) {
    var _a;
    var _format = (_a = options === null || options === void 0 ? void 0 : options.format) !== null && _a !== void 0 ? _a : (function (_a) {
        var timestamp = _a.timestamp, level = _a.level, category = _a.category, message = _a.message;
        return "".concat(timestamp, " ").concat(level, " ").concat(category, " ").concat(message);
    });
    // const format = options?.format
    return (0, logtape_1.getTextFormatter)(__assign(__assign({ timestamp: 'time', level: level, category: '.' }, options), { format: function (values) {
            return _format(appendErrorToMessage(values));
        } }));
}
var RESET = '\x1b[0m';
var ansiColors = {
    // black: "\x1b[30m",
    red: '\x1b[31m',
    // green: "\x1b[32m",
    // yellow: "\x1b[33m",
    // blue: "\x1b[34m",
    // magenta: "\x1b[35m",
    // cyan: "\x1b[36m",
    // white: "\x1b[37m",
};
/**
 * Build an ANSI-colored text formatter (level/category colors); appends error in red.
 * @param options - Optional format and logtape ANSI options
 * @returns TextFormatter with ANSI colors
 */
function getAnsiColorFormatter(options) {
    var _a;
    var _format = (_a = options === null || options === void 0 ? void 0 : options.format) !== null && _a !== void 0 ? _a : (function (_a) {
        var timestamp = _a.timestamp, level = _a.level, category = _a.category, message = _a.message;
        return "".concat(timestamp, " ").concat(level, " ").concat(category, " ").concat(message);
    });
    return (0, logtape_1.getAnsiColorFormatter)(__assign(__assign({ timestamp: 'time', level: level, categoryStyle: 'bold', categoryColor: 'cyan', category: '.' }, options), { format: function (values) {
            return _format(appendErrorToMessage(values, true));
        } }));
}
/**
 * The formatter returns an array where:
 * - First element is the formatted message string
 * - Second element is the record properties object
 * @param options - Optional messageFormatter (TextFormatter)
 * @returns ConsoleFormatter for console.log/error
 */
function getConsoleFormatter(options) {
    var formatter = options === null || options === void 0 ? void 0 : options.messageFormatter;
    if (formatter) {
        return function (record) {
            var properties = record.properties;
            if (properties && Object.keys(properties).length > 0) {
                return [
                    formatter(record),
                    properties,
                ];
            }
            return [formatter(record)];
        };
    }
    return function (record) {
        var message = record.message, properties = record.properties;
        if (properties && Object.keys(properties).length > 0) {
            return __spreadArray(__spreadArray([], message, true), [
                properties,
            ], false);
        }
        return message;
    };
}
