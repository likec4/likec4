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
exports.lastClickedNode = lastClickedNode;
exports.mergeXYNodesEdges = mergeXYNodesEdges;
exports.focusNodesEdges = focusNodesEdges;
exports.updateNodeData = updateNodeData;
exports.updateEdgeData = updateEdgeData;
exports.resetEdgeControlPoints = resetEdgeControlPoints;
var core_1 = require("@likec4/core");
var geometry_1 = require("@likec4/core/geometry");
var system_1 = require("@xyflow/system");
var fast_equals_1 = require("fast-equals");
var remeda_1 = require("remeda");
var xstate_1 = require("xstate");
var base_1 = require("../../base");
var xyflow_1 = require("../../utils/xyflow");
function lastClickedNode(params) {
    var lastClickedNode = params.context.lastClickedNode;
    if (!lastClickedNode || lastClickedNode.id !== params.event.node.id) {
        return {
            id: params.event.node.id,
            clicks: 1,
            timestamp: Date.now(),
        };
    }
    return {
        id: lastClickedNode.id,
        clicks: lastClickedNode.clicks + 1,
        timestamp: Date.now(),
    };
}
function mergeXYNodesEdges(context, event) {
    var nextView = event.view;
    var currentView = context.view;
    var isSameView = currentView.id === nextView.id;
    var isDynamicViewUpdate = nextView._type === 'dynamic'
        && nextView.variant === 'sequence';
    // If dynamic view update with sequence layout, just replace nodes and edges
    // because xyflow edges require full recalculation due to possible hadle changes
    if (isDynamicViewUpdate) {
        return {
            xynodes: event.xynodes,
            xyedges: event.xyedges,
            view: nextView,
        };
    }
    var xynodes = (0, base_1.updateNodes)(context.xynodes, event.xynodes);
    var xyedges = isSameView ? (0, base_1.updateEdges)(context.xyedges, event.xyedges) : event.xyedges;
    return {
        xynodes: xynodes,
        xyedges: xyedges,
        view: nextView,
    };
}
function focusNodesEdges(context) {
    var _xynodes = context.xynodes, _xyedges = context.xyedges, focusedNode = context.focusedNode;
    if (!focusedNode) {
        return null;
    }
    var focused = new Set([focusedNode]);
    var xyedges = _xyedges.map(function (edge) {
        if (edge.source === focusedNode || edge.target === focusedNode) {
            focused.add(edge.source);
            focused.add(edge.target);
            return base_1.Base.setData(edge, {
                dimmed: false,
                active: true,
            });
        }
        return base_1.Base.setData(edge, {
            dimmed: true,
            active: false,
        });
    });
    return {
        xynodes: _xynodes.map(function (n) { return base_1.Base.setDimmed(n, !focused.has(n.id)); }),
        xyedges: xyedges,
    };
}
function updateNodeData(_a) {
    var context = _a.context, event = _a.event;
    (0, xstate_1.assertEvent)(event, 'update.nodeData');
    var xynodes = context.xynodes.map(function (node) {
        if (node.id !== event.nodeId) {
            return node;
        }
        var data = (0, remeda_1.mergeDeep)(node.data, event.data);
        if ((0, fast_equals_1.deepEqual)(data, node.data)) {
            return node;
        }
        return __assign(__assign({}, node), { data: data });
    });
    return { xynodes: xynodes };
}
function updateEdgeData(_a) {
    var context = _a.context, event = _a.event;
    (0, xstate_1.assertEvent)(event, 'update.edgeData');
    var xyedges = context.xyedges.map(function (edge) {
        if (edge.id !== event.edgeId) {
            return edge;
        }
        var data = (0, remeda_1.mergeDeep)(edge.data, event.data);
        if ((0, fast_equals_1.deepEqual)(data, edge.data)) {
            return edge;
        }
        return __assign(__assign({}, edge), { data: data });
    });
    return { xyedges: xyedges };
}
function getBorderPointOnVector(node, nodeCenter, v) {
    var dimensions = (0, system_1.getNodeDimensions)(node);
    var xScale = dimensions.width / 2 / v.x;
    var yScale = dimensions.height / 2 / v.y;
    var scale = Math.min(Math.abs(xScale), Math.abs(yScale));
    return (0, geometry_1.vector)(v).multiply(scale).add(nodeCenter);
}
function resetEdgeControlPoints(nodeLookup, edge) {
    var source = (0, core_1.nonNullable)(nodeLookup.get(edge.source), "Source node ".concat(edge.source, " not found"));
    var target = (0, core_1.nonNullable)(nodeLookup.get(edge.target), "Target node ".concat(edge.target, " not found"));
    var sourceCenter = (0, geometry_1.vector)((0, xyflow_1.getNodeCenter)(source));
    var targetCenter = (0, geometry_1.vector)((0, xyflow_1.getNodeCenter)(target));
    // Edge is a loop
    if (source === target) {
        var loopSize = 80;
        var centerOfTopBoundary = (0, geometry_1.vector)(0, source.height || 0)
            .multiply(-0.5)
            .add(sourceCenter);
        return [
            centerOfTopBoundary.add((0, geometry_1.vector)(-loopSize / 2.5, -loopSize)).round().toObject(),
            centerOfTopBoundary.add((0, geometry_1.vector)(loopSize / 2.5, -loopSize)).round().toObject(),
        ];
    }
    var sourceToTargetVector = targetCenter.subtract(sourceCenter);
    var sourceBorderPoint = getBorderPointOnVector(source, sourceCenter, sourceToTargetVector);
    var targetBorderPoint = getBorderPointOnVector(target, targetCenter, sourceToTargetVector.multiply(-1));
    var sourceToTarget = targetBorderPoint.subtract(sourceBorderPoint);
    return [
        sourceBorderPoint.add(sourceToTarget.multiply(0.4)).round().toObject(),
        sourceBorderPoint.add(sourceToTarget.multiply(0.6)).round().toObject(),
    ];
}
