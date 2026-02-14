"use strict";
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
exports.useCallbackRef = useCallbackRef;
var react_1 = require("react");
/**
 * Memoizes a callback function so that it will not be recreated on every render.
 * The returned function is guaranteed to be the same reference across renders.
 * @param callback the callback function to memoize
 * @returns the memoized callback function
 */
function useCallbackRef(callback) {
    var ref = (0, react_1.useRef)(callback);
    ref.current = callback;
    return (0, react_1.useMemo)(function () {
        function callbackRef() {
            var _a;
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return (_a = ref.current) === null || _a === void 0 ? void 0 : _a.call.apply(_a, __spreadArray([ref], args, false));
        }
        return callbackRef;
    }, []);
}
