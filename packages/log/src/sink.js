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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConsoleSink = getConsoleSink;
exports.getConsoleStderrSink = getConsoleStderrSink;
var logtape_1 = require("@logtape/logtape");
var formatters_1 = require("./formatters");
/**
 * Create a sink that writes formatted log records to stdout (default formatter).
 * @param options - Optional console sink options (e.g. custom formatter)
 * @returns Sink that writes to stdout
 */
function getConsoleSink(options) {
    return (0, logtape_1.getConsoleSink)(__assign({ formatter: (0, formatters_1.getConsoleFormatter)() }, options));
}
/**
 * Creates a console sink that writes to stderr.
 * (MCP protocol requires stderr to be used for logging)
 * @param options - Optional console sink options (e.g. custom formatter)
 * @returns Sink that writes to stderr
 */
function getConsoleStderrSink(options) {
    var _a;
    var formatter = (_a = options === null || options === void 0 ? void 0 : options.formatter) !== null && _a !== void 0 ? _a : (0, formatters_1.getConsoleFormatter)();
    return function (record) {
        var args = formatter(record);
        if (typeof args === 'string') {
            var msg = args.replace(/\r?\n$/, '');
            console.error(msg);
        }
        else {
            console.error.apply(console, args);
        }
    };
}
