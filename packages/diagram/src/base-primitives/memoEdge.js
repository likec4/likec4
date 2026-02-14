"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.memoEdge = memoEdge;
var fast_equals_1 = require("fast-equals");
var react_1 = require("react");
// If points are within 3px, consider them the same
var isSame = function (a, b) {
    return Math.abs(a - b) < 2.5;
};
var edgePropsEqual = function (prev, next) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    return (prev.id === next.id
        && (0, fast_equals_1.deepEqual)((_a = prev.selected) !== null && _a !== void 0 ? _a : false, (_b = next.selected) !== null && _b !== void 0 ? _b : false)
        && (0, fast_equals_1.deepEqual)((_c = prev.animated) !== null && _c !== void 0 ? _c : false, (_d = next.animated) !== null && _d !== void 0 ? _d : false)
        && (0, fast_equals_1.deepEqual)(prev.source, next.source)
        && (0, fast_equals_1.deepEqual)(prev.target, next.target)
        && isSame(prev.sourceX, next.sourceX)
        && isSame(prev.sourceY, next.sourceY)
        && isSame(prev.targetX, next.targetX)
        && isSame(prev.targetY, next.targetY)
        && (0, fast_equals_1.deepEqual)((_e = prev.sourceHandleId) !== null && _e !== void 0 ? _e : null, (_f = next.sourceHandleId) !== null && _f !== void 0 ? _f : null)
        && (0, fast_equals_1.deepEqual)((_g = prev.targetHandleId) !== null && _g !== void 0 ? _g : null, (_h = next.targetHandleId) !== null && _h !== void 0 ? _h : null)
        && (0, fast_equals_1.deepEqual)(prev.sourcePosition, next.sourcePosition)
        && (0, fast_equals_1.deepEqual)(prev.targetPosition, next.targetPosition)
        && (0, fast_equals_1.deepEqual)(prev.data, next.data));
};
function memoEdge(Edge) {
    var Memo = (0, react_1.memo)(Edge, edgePropsEqual);
    Memo.displayName = "MemoEdge(".concat(Edge.displayName || Edge.name, ")");
    return Memo;
}
