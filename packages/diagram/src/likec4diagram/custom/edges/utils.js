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
exports.getPointPosition = getPointPosition;
exports.getEdgeParams = getEdgeParams;
var react_1 = require("@xyflow/react");
var system_1 = require("@xyflow/system");
var xyflow_1 = require("../../../utils/xyflow");
// returns the position (top,right,bottom or right) passed node compared to the intersection point
function getPointPosition(node, intersectionPoint) {
    var n = __assign(__assign({}, node.internals.positionAbsolute), (0, system_1.getNodeDimensions)(node));
    var nx = Math.round(n.x);
    var ny = Math.round(n.y);
    var px = Math.round(intersectionPoint.x);
    var py = Math.round(intersectionPoint.y);
    var handlePosition = react_1.Position.Top;
    if (px <= nx + 1) {
        handlePosition = react_1.Position.Left;
    }
    else if (px >= nx + n.width - 1) {
        handlePosition = react_1.Position.Right;
    }
    else if (py <= ny + 1) {
        handlePosition = react_1.Position.Top;
    }
    else if (py >= n.y + n.height - 1) {
        handlePosition = react_1.Position.Bottom;
    }
    var handleWidth = 8, handleHeight = 8;
    var offsetX = 0;
    var offsetY = 0;
    // this is a tiny detail to make the markerEnd of an edge visible.
    // The handle position that gets calculated has the origin top-left, so depending which side we are using, we add a little offset
    // when the handlePosition is Position.Right for example, we need to add an offset as big as the handle itself in order to get the correct position
    switch (handlePosition) {
        case react_1.Position.Left:
            offsetX = -handleWidth;
            break;
        case react_1.Position.Right:
            offsetX = handleWidth;
            break;
        case react_1.Position.Top:
            offsetY = -handleHeight;
            break;
        case react_1.Position.Bottom:
            offsetY = handleHeight;
            break;
    }
    return [
        intersectionPoint.x + offsetX,
        intersectionPoint.y + offsetY,
        handlePosition,
    ];
}
// returns the parameters (sx, sy, tx, ty, sourcePos, targetPos) you need to create an edge
function getEdgeParams(source, target) {
    var sourceIntersectionPoint = (0, xyflow_1.getNodeIntersection)(source, target);
    var targetIntersectionPoint = (0, xyflow_1.getNodeIntersection)(target, source);
    var _a = getPointPosition(source, sourceIntersectionPoint), sx = _a[0], sy = _a[1], sourcePos = _a[2];
    var _b = getPointPosition(target, targetIntersectionPoint), tx = _b[0], ty = _b[1], targetPos = _b[2];
    return {
        sx: sx,
        sy: sy,
        tx: tx,
        ty: ty,
        sourcePos: sourcePos,
        targetPos: targetPos,
    };
}
