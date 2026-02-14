"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.distance = distance;
exports.extractMinimalInternalNode = extractMinimalInternalNode;
exports.isEqualMinimalInternalNodes = isEqualMinimalInternalNodes;
exports.isEqualRects = isEqualRects;
exports.nodeToRect = nodeToRect;
exports.getNodeCenter = getNodeCenter;
exports.getNodeIntersectionFromCenterToPoint = getNodeIntersectionFromCenterToPoint;
exports.getNodeIntersection = getNodeIntersection;
exports.isInside = isInside;
exports.bezierControlPoints = bezierControlPoints;
exports.isSamePoint = isSamePoint;
exports.distanceBetweenPoints = distanceBetweenPoints;
exports.stopPropagation = stopPropagation;
exports.bezierPath = bezierPath;
exports.toXYFlowPosition = toXYFlowPosition;
exports.createXYFlowNodeNandles = createXYFlowNodeNandles;
exports.parsePaddings = parsePaddings;
var geometry_1 = require("@likec4/core/geometry");
var utils_1 = require("@likec4/core/utils");
var react_1 = require("@xyflow/react");
var system_1 = require("@xyflow/system");
var bezier_js_1 = require("bezier-js");
var remeda_1 = require("remeda");
function distance(a, b) {
    return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
}
/**
 * Extracts only the minimal properties from an InternalNode
 * needed for geometric calculations.
 *
 * @param nd - The InternalNode to extract from.
 * @returns An object containing only the necessary properties.
 */
function extractMinimalInternalNode(nd) {
    var minimal = {
        internals: {
            positionAbsolute: {
                x: Math.round(nd.internals.positionAbsolute.x),
                y: Math.round(nd.internals.positionAbsolute.y),
            },
        },
    };
    if (nd.measured) {
        minimal.measured = nd.measured;
    }
    if ((0, remeda_1.isNumber)(nd.width)) {
        minimal.width = nd.width;
    }
    if ((0, remeda_1.isNumber)(nd.height)) {
        minimal.height = nd.height;
    }
    if ((0, remeda_1.isNumber)(nd.initialWidth)) {
        minimal.initialWidth = nd.initialWidth;
    }
    if ((0, remeda_1.isNumber)(nd.initialHeight)) {
        minimal.initialHeight = nd.initialHeight;
    }
    return minimal;
}
function isEqualMinimalInternalNodes(a, b) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
    var posA = a.internals.positionAbsolute;
    var posB = b.internals.positionAbsolute;
    if (posA.x !== posB.x || posA.y !== posB.y) {
        return false;
    }
    var widthA = (_d = (_c = (_b = (_a = a.measured) === null || _a === void 0 ? void 0 : _a.width) !== null && _b !== void 0 ? _b : a.width) !== null && _c !== void 0 ? _c : a.initialWidth) !== null && _d !== void 0 ? _d : 0;
    var widthB = (_h = (_g = (_f = (_e = b.measured) === null || _e === void 0 ? void 0 : _e.width) !== null && _f !== void 0 ? _f : b.width) !== null && _g !== void 0 ? _g : b.initialWidth) !== null && _h !== void 0 ? _h : 0;
    if (widthA !== widthB) {
        return false;
    }
    var heightA = (_m = (_l = (_k = (_j = a.measured) === null || _j === void 0 ? void 0 : _j.height) !== null && _k !== void 0 ? _k : a.height) !== null && _l !== void 0 ? _l : a.initialHeight) !== null && _m !== void 0 ? _m : 0;
    var heightB = (_r = (_q = (_p = (_o = b.measured) === null || _o === void 0 ? void 0 : _o.height) !== null && _p !== void 0 ? _p : b.height) !== null && _q !== void 0 ? _q : b.initialHeight) !== null && _r !== void 0 ? _r : 0;
    return heightA === heightB;
}
function isEqualRects(a, b) {
    return Math.trunc(a.x) === Math.trunc(b.x)
        && Math.trunc(a.y) === Math.trunc(b.y)
        && Math.trunc(a.width) === Math.trunc(b.width)
        && Math.trunc(a.height) === Math.trunc(b.height);
}
function nodeToRect(nd) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    return ({
        x: Math.trunc(nd.internals.positionAbsolute.x),
        y: Math.trunc(nd.internals.positionAbsolute.y),
        width: Math.round((_d = (_c = (_b = (_a = nd.measured) === null || _a === void 0 ? void 0 : _a.width) !== null && _b !== void 0 ? _b : nd.width) !== null && _c !== void 0 ? _c : nd.initialWidth) !== null && _d !== void 0 ? _d : 0),
        height: Math.round((_h = (_g = (_f = (_e = nd.measured) === null || _e === void 0 ? void 0 : _e.height) !== null && _f !== void 0 ? _f : nd.height) !== null && _g !== void 0 ? _g : nd.initialHeight) !== null && _h !== void 0 ? _h : 0),
    });
}
function getNodeCenter(node) {
    var _a = (0, system_1.getNodeDimensions)(node), width = _a.width, height = _a.height;
    var _b = node.internals.positionAbsolute, x = _b.x, y = _b.y;
    return {
        x: Math.round(x + width / 2),
        y: Math.round(y + height / 2),
    };
}
/**
 * Helper function returns the intersection point
 * of the line between the center of the intersectionNode and the target
 *
 * @param intersectionNode the node that is the center of the line
 * @param target position of the target
 * @param nodeMargin the margin of the intersectionNode. The point will be placed at nodeMargin distance from the border of the node
 * @returns coordinates of the intersection point
 */
function getNodeIntersectionFromCenterToPoint(intersectionNode, target, nodeMargin) {
    if (nodeMargin === void 0) { nodeMargin = 0; }
    var width = intersectionNode.width, height = intersectionNode.height;
    var nodeCenter = geometry_1.BBox.center(intersectionNode);
    var v = (0, geometry_1.vector)(target.x, target.y).subtract(nodeCenter);
    var xScale = (nodeMargin + width / 2) / v.x;
    var yScale = (nodeMargin + height / 2) / v.y;
    var scale = Math.min(Math.abs(xScale), Math.abs(yScale));
    return (0, geometry_1.vector)(v).multiply(scale).add(nodeCenter).trunc().toObject();
}
/**
 * Helper function returns the intersection point
 * of the line between the center of the intersectionNode and the target
 *
 * @param intersectionNode the node that is the center of the line
 * @param targetNode the target node
 * @returns coordinates of the intersection point
 */
function getNodeIntersection(intersectionNode, targetNode) {
    return getNodeIntersectionFromCenterToPoint(nodeToRect(intersectionNode), getNodeCenter(targetNode));
}
/**
 * Checks if a rectangle is completely inside another rectangle.
 *
 * @param test - The rectangle to test.
 * @param target - The target rectangle.
 * @returns `true` if the `test` rectangle is completely inside the `target` rectangle, otherwise `false`.
 */
function isInside(test, target) {
    return (test.x >= target.x
        && test.y >= target.y
        && test.x + test.width <= target.x + target.width
        && test.y + test.height <= target.y + target.height);
}
function bezierControlPoints(points) {
    var start = points[0], bezierPoints = points.slice(1);
    (0, utils_1.invariant)(start, 'start should be defined');
    var handles = [
    // start
    ];
    var _loop_1 = function () {
        var cp1 = bezierPoints[0], cp2 = bezierPoints[1], end = bezierPoints[2], rest = bezierPoints.slice(3);
        var bezier = new bezier_js_1.Bezier(start[0], start[1], cp1[0], cp1[1], cp2[0], cp2[1], end[0], end[1]);
        // TODO: temporary, we need correcly derive catmull-rom from bezier. Actually, from poly-bezier
        var inflections = bezier.inflections();
        if (inflections.length === 0) {
            inflections.push(0.5);
        }
        inflections.forEach(function (t) {
            var _a = bezier.get(t), x = _a.x, y = _a.y;
            handles.push({
                x: Math.trunc(x),
                y: Math.trunc(y),
            });
        });
        bezierPoints = rest;
        start = end;
    };
    while ((0, remeda_1.hasAtLeast)(bezierPoints, 3)) {
        _loop_1();
    }
    (0, utils_1.invariant)(bezierPoints.length === 0, 'all points should be consumed');
    (0, utils_1.invariant)((0, remeda_1.hasAtLeast)(handles, 1), 'at least one control point should be generated');
    return handles;
}
/**
 * Checks if two points are the same, considering both XYPoint (object ) and Point (tuple) formats.
 * @returns `true` If points are within 2px
 */
function isSamePoint(a, b) {
    if (a === b) {
        return true;
    }
    var _a = (0, remeda_1.isArray)(a) ? a : [a.x, a.y], ax = _a[0], ay = _a[1];
    var _b = (0, remeda_1.isArray)(b) ? b : [b.x, b.y], bx = _b[0], by = _b[1];
    return Math.hypot(bx - ax, by - ay) < 2.1;
}
function distanceBetweenPoints(a, b) {
    return Math.hypot(b.x - a.x, b.y - a.y);
}
function stopPropagation(e) {
    e.nativeEvent.stopImmediatePropagation();
    e.stopPropagation();
}
var printPoint = function (point) {
    return "".concat(Math.trunc(point[0]), ",").concat(Math.trunc(point[1]));
};
function bezierPath(bezierSpline) {
    var start = bezierSpline[0], points = bezierSpline.slice(1);
    (0, utils_1.invariant)(start, 'start should be defined');
    var path = "M ".concat(printPoint(start));
    while ((0, remeda_1.hasAtLeast)(points, 3)) {
        var cp1 = points[0], cp2 = points[1], end = points[2], rest = points.slice(3);
        path = path + " C ".concat(printPoint(cp1), " ").concat(printPoint(cp2), " ").concat(printPoint(end));
        points = rest;
    }
    (0, utils_1.invariant)(points.length === 0, 'all points should be consumed');
    return path;
}
function toXYFlowPosition(position) {
    switch (position) {
        case 'left':
            return react_1.Position.Left;
        case 'right':
            return react_1.Position.Right;
        case 'top':
            return react_1.Position.Top;
        case 'bottom':
            return react_1.Position.Bottom;
    }
}
function createXYFlowNodeNandles(bbox) {
    var center = geometry_1.BBox.center(bbox);
    return (0, remeda_1.flatMap)(['source', 'target'], function (type) { return [
        {
            type: type,
            position: react_1.Position.Top,
            x: center.x,
            y: bbox.y,
        },
        {
            type: type,
            position: react_1.Position.Left,
            x: bbox.x,
            y: center.y,
        },
        {
            type: type,
            position: react_1.Position.Right,
            x: bbox.x + bbox.width,
            y: center.y,
        },
        {
            type: type,
            position: react_1.Position.Bottom,
            x: center.x,
            y: bbox.y + bbox.height,
        },
    ]; });
}
/**
 * Parses a single padding value to a number
 * @internal
 * @param padding - Padding to parse
 * @param viewport - Width or height of the viewport
 * @returns The padding in pixels
 */
function parsePadding(padding, viewport) {
    if (typeof padding === 'number') {
        return Math.floor((viewport - viewport / (1 + padding)) * 0.5);
    }
    if (typeof padding === 'string' && padding.endsWith('px')) {
        var paddingValue = parseFloat(padding);
        if (!Number.isNaN(paddingValue)) {
            return Math.floor(paddingValue);
        }
    }
    if (typeof padding === 'string' && padding.endsWith('%')) {
        var paddingValue = parseFloat(padding);
        if (!Number.isNaN(paddingValue)) {
            return Math.floor(viewport * paddingValue * 0.01);
        }
    }
    console.error("[React Flow] The padding value \"".concat(padding, "\" is invalid. Please provide a number or a string with a valid unit (px or %)."));
    return 0;
}
/**
 * Parses the paddings to an object with top, right, bottom, left, x and y paddings
 * @internal
 * @param padding - Padding to parse
 * @param width - Width of the viewport
 * @param height - Height of the viewport
 * @returns An object with the paddings in pixels
 */
function parsePaddings(padding, width, height) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    if (typeof padding === 'string' || typeof padding === 'number') {
        var paddingY = parsePadding(padding, height);
        var paddingX = parsePadding(padding, width);
        return {
            top: paddingY,
            right: paddingX,
            bottom: paddingY,
            left: paddingX,
            x: paddingX * 2,
            y: paddingY * 2,
        };
    }
    if (typeof padding === 'object') {
        var top_1 = parsePadding((_b = (_a = padding.top) !== null && _a !== void 0 ? _a : padding.y) !== null && _b !== void 0 ? _b : 0, height);
        var bottom = parsePadding((_d = (_c = padding.bottom) !== null && _c !== void 0 ? _c : padding.y) !== null && _d !== void 0 ? _d : 0, height);
        var left = parsePadding((_f = (_e = padding.left) !== null && _e !== void 0 ? _e : padding.x) !== null && _f !== void 0 ? _f : 0, width);
        var right = parsePadding((_h = (_g = padding.right) !== null && _g !== void 0 ? _g : padding.x) !== null && _h !== void 0 ? _h : 0, width);
        return { top: top_1, right: right, bottom: bottom, left: left, x: left + right, y: top_1 + bottom };
    }
    return { top: 0, right: 0, bottom: 0, left: 0, x: 0, y: 0 };
}
