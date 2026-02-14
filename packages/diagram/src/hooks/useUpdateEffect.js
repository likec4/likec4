"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.depsShallowEqual = void 0;
exports.useUpdateEffect = useUpdateEffect;
var web_1 = require("@react-hookz/web");
var fast_equals_1 = require("fast-equals");
var noop = function () { };
var depsShallowEqual = function (d1, d2) {
    if (d1 === d2) {
        return true;
    }
    if (d1.length !== d2.length) {
        return false;
    }
    for (var _i = 0, _a = d1.entries(); _i < _a.length; _i++) {
        var _b = _a[_i], i = _b[0], element = _b[1];
        if (element === d2[i] || (0, fast_equals_1.shallowEqual)(element, d2[i])) {
            continue;
        }
        return false;
    }
    return true;
};
exports.depsShallowEqual = depsShallowEqual;
function useUpdateEffect(callback, deps, equalityFn, effectHook) {
    var isFirstMount = (0, web_1.useFirstMountState)();
    (0, web_1.useCustomCompareEffect)(isFirstMount ? noop : callback, deps, equalityFn !== null && equalityFn !== void 0 ? equalityFn : exports.depsShallowEqual, effectHook);
}
