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
exports.Base = void 0;
var remeda_1 = require("remeda");
var _setDimmed = function (v, dimmed) {
    var _a;
    return ((_a = v.data.dimmed) !== null && _a !== void 0 ? _a : false) === dimmed ? v : (__assign(__assign({}, v), { data: __assign(__assign({}, v.data), { dimmed: dimmed }) }));
};
function setDimmed(arg1, arg2) {
    if (arg2 !== undefined) {
        return _setDimmed(arg1, arg2);
    }
    return function (v) { return _setDimmed(v, arg1); };
}
var _setHovered = function (v, hovered) {
    var _a;
    return ((_a = v.data.hovered) !== null && _a !== void 0 ? _a : false) === hovered ? v : (__assign(__assign({}, v), { data: __assign(__assign({}, v.data), { hovered: hovered }) }));
};
function setHovered(arg1, arg2) {
    if (arg2 !== undefined) {
        return _setHovered(arg1, arg2);
    }
    return function (v) { return _setHovered(v, arg1); };
}
function _setData(value, state) {
    if ((0, remeda_1.hasSubObject)(value.data, state)) {
        return value;
    }
    return __assign(__assign({}, value), { data: __assign(__assign({}, value.data), state) });
}
function setData(arg1, arg2) {
    if (arg2 !== undefined) {
        return _setData(arg1, arg2);
    }
    return function (edge) { return _setData(edge, arg1); };
}
exports.Base = {
    setDimmed: setDimmed,
    setHovered: setHovered,
    setData: setData,
};
