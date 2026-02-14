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
exports.useControlPoints = useControlPoints;
var geometry_1 = require("@likec4/core/geometry");
var fast_equals_1 = require("fast-equals");
var react_1 = require("react");
var useCallbackRef_1 = require("../../../hooks/useCallbackRef");
var useUpdateEffect_1 = require("../../../hooks/useUpdateEffect");
var xyflow_1 = require("../../../utils/xyflow");
function useControlPoints(_a) {
    var _b;
    var sourceX = _a.sourceX, sourceY = _a.sourceY, targetX = _a.targetX, targetY = _a.targetY, data = _a.data;
    var _c = (0, react_1.useState)(function () { var _a; return (_a = data.controlPoints) !== null && _a !== void 0 ? _a : (0, xyflow_1.bezierControlPoints)(data.points); }), controlPoints = _c[0], setControlPoints = _c[1];
    (0, useUpdateEffect_1.useUpdateEffect)(function () {
        var _a;
        var next = (_a = data.controlPoints) !== null && _a !== void 0 ? _a : (0, xyflow_1.bezierControlPoints)(data.points);
        setControlPoints(function (prev) { return (0, fast_equals_1.deepEqual)(prev, next) ? prev : next; });
    }, [
        data.points,
        (_b = data.controlPoints) !== null && _b !== void 0 ? _b : [],
    ]);
    /**
     * Find index where to insert new control point
     * coordinates must be in flow space
     */
    var insertControlPoint = (0, useCallbackRef_1.useCallbackRef)(function (_a) {
        var x = _a.x, y = _a.y;
        var sourceV = (0, geometry_1.vector)(sourceX, sourceY);
        var targetV = (0, geometry_1.vector)(targetX, targetY);
        var points = __spreadArray(__spreadArray([
            data.dir === 'back' ? targetV : sourceV
        ], controlPoints.map(geometry_1.vector) || [], true), [
            data.dir === 'back' ? sourceV : targetV,
        ], false);
        var newPointV = (0, geometry_1.vector)(x, y).round();
        var insertionIndex = 0;
        var minDistance = Infinity;
        for (var i = 0; i < points.length - 1; i++) {
            var a = points[i], b = points[i + 1], fromCurrentToNext = b.subtract(a), fromCurrentToNew = newPointV.subtract(a), fromNextToNew = newPointV.subtract(b);
            // Is pointer above the current segment?
            if (fromCurrentToNext.dot(fromCurrentToNew) * fromCurrentToNext.dot(fromNextToNew) < 0) {
                // Calculate distance by approximating edge segment with a staight line
                var distanceToEdge = Math.abs(fromCurrentToNext.cross(fromCurrentToNew)) / fromCurrentToNext.length();
                if (distanceToEdge < minDistance) {
                    minDistance = distanceToEdge;
                    insertionIndex = i;
                }
            }
        }
        var newControlPoints = controlPoints.slice();
        newControlPoints.splice(insertionIndex, 0, { x: newPointV.x, y: newPointV.y });
        setControlPoints(newControlPoints);
        return newControlPoints;
    });
    return {
        controlPoints: controlPoints,
        setControlPoints: setControlPoints,
        insertControlPoint: insertControlPoint,
    };
}
