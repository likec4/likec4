"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.memoNode = memoNode;
var fast_equals_1 = require("fast-equals");
var react_1 = require("react");
function nodePropsEqual(prev, next) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    return (prev.id === next.id
        && (0, fast_equals_1.deepEqual)(prev.type, next.type)
        && (0, fast_equals_1.deepEqual)((_a = prev.parentId) !== null && _a !== void 0 ? _a : '', (_b = next.parentId) !== null && _b !== void 0 ? _b : '')
        && (0, fast_equals_1.deepEqual)((_c = prev.selected) !== null && _c !== void 0 ? _c : false, (_d = next.selected) !== null && _d !== void 0 ? _d : false)
        && (0, fast_equals_1.deepEqual)((_e = prev.dragging) !== null && _e !== void 0 ? _e : false, (_f = next.dragging) !== null && _f !== void 0 ? _f : false)
        && (0, fast_equals_1.deepEqual)((_g = prev.width) !== null && _g !== void 0 ? _g : 0, (_h = next.width) !== null && _h !== void 0 ? _h : 0)
        && (0, fast_equals_1.deepEqual)((_j = prev.height) !== null && _j !== void 0 ? _j : 0, (_k = next.height) !== null && _k !== void 0 ? _k : 0)
        && (0, fast_equals_1.deepEqual)((_l = prev.zIndex) !== null && _l !== void 0 ? _l : 0, (_m = next.zIndex) !== null && _m !== void 0 ? _m : 0)
        // we can ignore position, as custom nodes positioned relative to it's NodeRenderer
        // && eq(prev.positionAbsoluteX, next.positionAbsoluteX)
        // && eq(prev.positionAbsoluteY, next.positionAbsoluteY)
        && (0, fast_equals_1.deepEqual)(prev.data, next.data));
}
var isMemoized = Symbol.for('isMemoized');
function memoNode(Node, displayName) {
    if (displayName === void 0) { displayName = 'Node'; }
    if (Node.hasOwnProperty(isMemoized)) {
        return Node;
    }
    var NodeComponent = (0, react_1.memo)(Node, nodePropsEqual);
    NodeComponent.displayName = displayName;
    // To avoid memoizing the same node multiple times
    Object.defineProperty(NodeComponent, isMemoized, {
        enumerable: false,
        writable: false,
        value: true,
    });
    return NodeComponent;
}
