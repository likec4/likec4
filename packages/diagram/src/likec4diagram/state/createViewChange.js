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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createViewChange = createViewChange;
var system_1 = require("@xyflow/system");
var remeda_1 = require("remeda");
var view_bounds_1 = require("../../utils/view-bounds");
var xyflow_1 = require("../../utils/xyflow");
function createViewChange(parentContext) {
    var _a = parentContext.view, _1 = _a.drifts, // Ignore drifts from view
    _2 = _a._layout, // Ignore layout type from view
    view = __rest(_a, ["drifts", "_layout"]), xynodes = parentContext.xynodes, xystore = parentContext.xystore;
    var _b = xystore.getState(), nodeLookup = _b.nodeLookup, edgeLookup = _b.edgeLookup;
    var movedNodes = new Set();
    var nodes = (0, remeda_1.map)(view.nodes, function (node) {
        var _a, _b;
        var internal = nodeLookup.get(node.id);
        if (!internal) {
            console.error("Internal node not found for ".concat(node.id));
            return node;
        }
        var xynodedata = (_b = (_a = xynodes.find(function (n) { return n.id === node.id; })) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : internal.data;
        var position = internal.internals.positionAbsolute;
        var _c = (0, system_1.getNodeDimensions)(internal), width = _c.width, height = _c.height;
        var isChanged = !(0, xyflow_1.isSamePoint)(position, node)
            || node.width !== width
            || node.height !== height;
        if (isChanged) {
            movedNodes.add(node.id);
        }
        return __assign(__assign({}, node), { shape: xynodedata.shape, color: xynodedata.color, style: __assign({}, xynodedata.style), x: Math.floor(position.x), y: Math.floor(position.y), width: Math.ceil(width), height: Math.ceil(height) });
    });
    var edges = (0, remeda_1.map)(view.edges, function (edge) {
        var _a;
        var xyedge = edgeLookup.get(edge.id);
        if (!xyedge) {
            console.error("Internal edge not found for ".concat(edge.id));
            return edge;
        }
        var data = xyedge.data;
        var controlPoints = (_a = data.controlPoints) !== null && _a !== void 0 ? _a : [];
        var sourceOrTargetMoved = movedNodes.has(xyedge.source) || movedNodes.has(xyedge.target);
        // If edge control points are not set, but the source or target node was moved
        if (controlPoints.length === 0 && sourceOrTargetMoved) {
            controlPoints = (0, xyflow_1.bezierControlPoints)(data.points);
        }
        var _updated = __assign(__assign({}, edge), { points: data.points });
        if (data.labelBBox) {
            _updated.labelBBox = {
                x: Math.round(data.labelBBox.x),
                y: Math.round(data.labelBBox.y),
                width: Math.round(data.labelBBox.width),
                height: Math.round(data.labelBBox.height),
            };
        }
        else {
            _updated.labelBBox = null;
        }
        if ((0, remeda_1.hasAtLeast)(controlPoints, 1)) {
            _updated.controlPoints = (0, remeda_1.map)(controlPoints, function (v) { return ({
                x: Math.round(v.x),
                y: Math.round(v.y),
            }); });
        }
        else {
            _updated.controlPoints = null;
        }
        return _updated;
    });
    var snapshot = __assign(__assign({}, view), { _layout: 'manual', bounds: (0, view_bounds_1.calcViewBounds)({ nodes: nodes, edges: edges }), nodes: nodes, edges: edges });
    return {
        op: 'save-view-snapshot',
        layout: snapshot,
    };
}
