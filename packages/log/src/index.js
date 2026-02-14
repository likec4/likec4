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
exports.wrapError = exports.loggable = exports.rootLogger = exports.consola = exports.logger = exports.withFilter = exports.getConsoleStderrSink = exports.getConsoleSink = exports.getTextFormatter = exports.getMessageOnlyFormatter = exports.getConsoleFormatter = exports.getAnsiColorFormatter = exports.errorFromLogRecord = void 0;
exports.createLogger = createLogger;
exports.configureLogger = configureLogger;
var logtape_1 = require("@logtape/logtape");
var sink_1 = require("./sink");
var formatters_1 = require("./formatters");
Object.defineProperty(exports, "errorFromLogRecord", { enumerable: true, get: function () { return formatters_1.errorFromLogRecord; } });
// formatProperties,
// formatRecord,
Object.defineProperty(exports, "getAnsiColorFormatter", { enumerable: true, get: function () { return formatters_1.getAnsiColorFormatter; } });
Object.defineProperty(exports, "getConsoleFormatter", { enumerable: true, get: function () { return formatters_1.getConsoleFormatter; } });
Object.defineProperty(exports, "getMessageOnlyFormatter", { enumerable: true, get: function () { return formatters_1.getMessageOnlyFormatter; } });
Object.defineProperty(exports, "getTextFormatter", { enumerable: true, get: function () { return formatters_1.getTextFormatter; } });
var sink_2 = require("./sink");
Object.defineProperty(exports, "getConsoleSink", { enumerable: true, get: function () { return sink_2.getConsoleSink; } });
Object.defineProperty(exports, "getConsoleStderrSink", { enumerable: true, get: function () { return sink_2.getConsoleStderrSink; } });
var logtape_2 = require("@logtape/logtape");
Object.defineProperty(exports, "withFilter", { enumerable: true, get: function () { return logtape_2.withFilter; } });
exports.logger = (0, logtape_1.getLogger)('likec4');
exports.consola = exports.logger;
exports.rootLogger = exports.logger;
var utils_1 = require("./utils");
Object.defineProperty(exports, "loggable", { enumerable: true, get: function () { return utils_1.loggable; } });
Object.defineProperty(exports, "wrapError", { enumerable: true, get: function () { return utils_1.wrapError; } });
/**
 * Get a child logger with the given subcategory.
 *
 * @param subcategory The subcategory.
 * @returns The child logger.
 */
function createLogger(subcategory) {
    return exports.logger.getChild(subcategory);
}
/**
 * Configure the global logger: sinks, loggers, and lowest level per category.
 * @param config - Optional partial config (sinks, loggers). Merged with defaults.
 */
function configureLogger(config) {
    var _a, _b;
    try {
        var sinks = (_a = config === null || config === void 0 ? void 0 : config.sinks) !== null && _a !== void 0 ? _a : {};
        var sinksWithConsole = __assign({ console: (0, sink_1.getConsoleSink)() }, sinks);
        (0, logtape_1.configureSync)(__assign(__assign({ reset: true }, config), { sinks: sinksWithConsole, loggers: __spreadArray([
                { category: ['logtape', 'meta'], sinks: ['console'], lowestLevel: 'warning' }
            ], ((_b = config === null || config === void 0 ? void 0 : config.loggers) !== null && _b !== void 0 ? _b : [
                {
                    category: 'likec4',
                    sinks: ['console'],
                    lowestLevel: 'debug',
                },
            ]), true) }));
    }
    catch (e) {
        console.error(e);
    }
}
