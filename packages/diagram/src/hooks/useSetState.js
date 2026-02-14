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
exports.useSetState = useSetState;
var fast_equals_1 = require("fast-equals");
var react_1 = require("react");
/**
 * Differs from useState in that:
 * - it uses custom equal function (shallowEqual by default) to determine whether the state has changed.
 * - allows partial updates to the state
 */
function useSetState(initialState, equal) {
    var _a = (0, react_1.useState)(initialState), state = _a[0], _setState = _a[1];
    var equalFn = equal !== null && equal !== void 0 ? equal : fast_equals_1.shallowEqual;
    var equalFnRef = (0, react_1.useRef)(equalFn);
    equalFnRef.current = equalFn;
    var setState = (0, react_1.useCallback)(function (statePartial) {
        return _setState(function (current) {
            var next = __assign(__assign({}, current), typeof statePartial === 'function' ? statePartial(current) : statePartial);
            return equalFnRef.current(current, next) ? current : next;
        });
    }, [_setState]);
    return [state, setState];
}
