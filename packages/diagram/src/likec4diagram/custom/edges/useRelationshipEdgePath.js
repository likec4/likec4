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
exports.useRelationshipEdgePath = useRelationshipEdgePath;
// oxlint-disable exhaustive-deps
var geometry_1 = require("@likec4/core/geometry");
var utils_1 = require("@likec4/core/utils");
var system_1 = require("@xyflow/system");
var d3_shape_1 = require("d3-shape");
var fast_equals_1 = require("fast-equals");
var react_1 = require("react");
var remeda_1 = require("remeda");
var useXYFlow_1 = require("../../../hooks/useXYFlow");
var xyflow_1 = require("../../../utils/xyflow");
var curve = (0, d3_shape_1.line)()
    .curve(d3_shape_1.curveCatmullRomOpen.alpha(0.7))
    .x(function (d) { return Math.trunc(d.x); })
    .y(function (d) { return Math.trunc(d.y); });
/**
 * @returns SVG path data string for relationship edge
 */
function useRelationshipEdgePath(_a) {
    var _b, _c, _d, _e;
    var _f = _a.props, sourceX = _f.sourceX, sourceY = _f.sourceY, source = _f.source, target = _f.target, targetX = _f.targetX, targetY = _f.targetY, data = _f.data, controlPoints = _a.controlPoints, isControlPointDragging = _a.isControlPointDragging;
    // Subscribe to mimimal node changes to update edge path when nodes move
    var _g = (0, useXYFlow_1.useXYStore)((0, react_1.useCallback)(function (_a) {
        var nodeLookup = _a.nodeLookup;
        var sourceNode = (0, system_1.getNodeDimensions)((0, utils_1.nonNullable)(nodeLookup.get(source), "source node ".concat(source, " not found")));
        var targetNode = (0, system_1.getNodeDimensions)((0, utils_1.nonNullable)(nodeLookup.get(target), "target node ".concat(target, " not found")));
        return [
            Math.ceil(sourceNode.width),
            Math.ceil(sourceNode.height),
            Math.ceil(targetNode.width),
            Math.ceil(targetNode.height),
        ];
    }, [source, target]), fast_equals_1.shallowEqual), sourceNodeWidth = _g[0], sourceNodeHeight = _g[1], targetNodeWidth = _g[2], targetNodeHeight = _g[3];
    var isModified = (0, remeda_1.isTruthy)(data.controlPoints) || isControlPointDragging;
    if (!isModified) {
        return (0, xyflow_1.bezierPath)(data.points);
    }
    var sourceCenterPos = (0, geometry_1.vector)(sourceX, sourceY).trunc();
    var targetCenterPos = (0, geometry_1.vector)(targetX, targetY).trunc();
    var sourceNd = __assign(__assign({}, sourceCenterPos
        .subtract((0, geometry_1.vector)(sourceNodeWidth, sourceNodeHeight).divide(2))
        .trunc()
        .toObject()), { width: sourceNodeWidth, height: sourceNodeHeight });
    var targetNd = __assign(__assign({}, targetCenterPos
        .subtract((0, geometry_1.vector)(targetNodeWidth, targetNodeHeight).divide(2))
        .trunc()
        .toObject()), { width: targetNodeWidth, height: targetNodeHeight });
    var nodeMargin = 6;
    var points = data.dir === 'back'
        ? __spreadArray(__spreadArray([
            targetCenterPos,
            (0, xyflow_1.getNodeIntersectionFromCenterToPoint)(targetNd, (_b = (0, remeda_1.first)(controlPoints)) !== null && _b !== void 0 ? _b : sourceCenterPos, nodeMargin)
        ], controlPoints, true), [
            (0, xyflow_1.getNodeIntersectionFromCenterToPoint)(sourceNd, (_c = (0, remeda_1.last)(controlPoints)) !== null && _c !== void 0 ? _c : targetCenterPos, nodeMargin),
            sourceCenterPos,
        ], false) : __spreadArray(__spreadArray([
        sourceCenterPos,
        (0, xyflow_1.getNodeIntersectionFromCenterToPoint)(sourceNd, (_d = (0, remeda_1.first)(controlPoints)) !== null && _d !== void 0 ? _d : targetCenterPos, nodeMargin)
    ], controlPoints, true), [
        (0, xyflow_1.getNodeIntersectionFromCenterToPoint)(targetNd, (_e = (0, remeda_1.last)(controlPoints)) !== null && _e !== void 0 ? _e : sourceCenterPos, nodeMargin),
        targetCenterPos,
    ], false);
    return (0, utils_1.nonNullable)(curve(points));
}
