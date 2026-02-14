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
exports.pickViewBounds = pickViewBounds;
exports.calcEdgeBounds = calcEdgeBounds;
exports.calcViewBounds = calcViewBounds;
var core_1 = require("@likec4/core");
var geometry_1 = require("@likec4/core/geometry");
/**
 * Picks appropriate bounds from the view,
 * depending on its type and dynamic variant
 */
function pickViewBounds(view, dynamicVariant) {
    if (view._type === 'dynamic') {
        try {
            var variant = dynamicVariant !== null && dynamicVariant !== void 0 ? dynamicVariant : view.variant;
            if (variant === 'sequence') {
                (0, core_1.invariant)(view.sequenceLayout, 'Sequence layout is not available');
                (0, core_1.invariant)(view.sequenceLayout.bounds, 'Sequence layout bounds are not available');
                return view.sequenceLayout.bounds;
            }
        }
        catch (error) {
            console.error(error);
            // noop
        }
    }
    return view.bounds;
}
function calcEdgeBounds(_a) {
    var points = _a.points, controlPoints = _a.controlPoints, labelBBox = _a.labelBBox;
    var minX = Infinity;
    var minY = Infinity;
    var maxX = -Infinity;
    var maxY = -Infinity;
    // Prefer control points in bounds calculation if they exist
    if (controlPoints) {
        for (var _i = 0, controlPoints_1 = controlPoints; _i < controlPoints_1.length; _i++) {
            var p = controlPoints_1[_i];
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
        }
    }
    else {
        for (var _b = 0, points_1 = points; _b < points_1.length; _b++) {
            var _c = points_1[_b], x = _c[0], y = _c[1];
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
        }
    }
    if (labelBBox) {
        minX = Math.min(minX, labelBBox.x);
        minY = Math.min(minY, labelBBox.y);
        maxX = Math.max(maxX, labelBBox.x + labelBBox.width);
        maxY = Math.max(maxY, labelBBox.y + labelBBox.height);
    }
    return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
    };
}
function calcViewBounds(_a) {
    var nodes = _a.nodes, edges = _a.edges;
    return geometry_1.BBox.expand(geometry_1.BBox.merge.apply(geometry_1.BBox, __spreadArray(__spreadArray([], nodes, false), edges.map(calcEdgeBounds).filter(function (box) { return isFinite(box.x) && isFinite(box.y); }), false)), 20);
}
