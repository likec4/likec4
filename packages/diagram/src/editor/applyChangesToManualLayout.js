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
exports.applyChangesToManualLayout = applyChangesToManualLayout;
var core_1 = require("@likec4/core");
var geometry_1 = require("@likec4/core/geometry");
var immer_1 = require("immer");
var remeda_1 = require("remeda");
/**
 * Applies changes to a manual layout.
 *
 * @param manual - The manual layout.
 * @param latest - The latest layout.
 */
function applyChangesToManualLayout(manualView, latestView) {
    // Disable auto-freeze during this operation
    try {
        (0, immer_1.setAutoFreeze)(false);
        return _applyChangesToManualLayout(manualView, latestView);
    }
    finally {
        (0, immer_1.setAutoFreeze)(true);
    }
}
var isRootNode = function (node) { return (0, remeda_1.isNullish)(node.parent); };
function _applyChangesToManualLayout(manualView, latestView) {
    (0, core_1.invariant)(manualView.id === latestView.id, 'View IDs do not match');
    (0, core_1.invariant)(manualView._type === latestView._type, 'View types do not match');
    (0, core_1.invariant)(manualView._layout === 'manual' && latestView._layout === 'auto', 'Views must be manual and auto');
    var compounds = new Set();
    var newnodes = new Set();
    var isNotCompound = function (node) { return !compounds.has(typeof node === 'string' ? node : node.id); };
    var isBetweenNewLeafNodes = function (edge) {
        return newnodes.has(edge.source)
            && newnodes.has(edge.target)
            && isNotCompound(edge.source)
            && isNotCompound(edge.target);
    };
    var nodesMap = new Map(latestView.nodes.map(function (latest) {
        // register compound nodes to track them later
        if (latest.children && latest.children.length > 0) {
            compounds.add(latest.id);
        }
        var manual = manualView.nodes.find(function (n) { return n.id === latest.id; });
        if (manual) {
            return [latest.id, applyFromManualNode({ latest: latest, manual: manual })];
        }
        newnodes.add(latest.id);
        return [latest.id, removeDrift(latest)];
    }));
    var newNodesOnly = newnodes.size === nodesMap.size;
    if (newNodesOnly) {
        // When only new nodes are added, we just take latest view
        return (0, immer_1.produce)(latestView, function (draft) {
            draft._layout = 'manual';
            draft.nodes = (0, immer_1.castDraft)(__spreadArray([], nodesMap.values(), true));
            draft.edges = (0, immer_1.castDraft)(latestView.edges.map(removeDrift));
            // Clear drifts
            delete draft.drifts;
        });
    }
    if (compounds.size > 0) {
        expandCompoundNodes(nodesMap);
    }
    // Order is preserved from MAP
    var nodes = __spreadArray([], nodesMap.values(), true);
    var edges = latestView.edges.map(function (latest) {
        var _a;
        var dir = (_a = latest.dir) !== null && _a !== void 0 ? _a : 'forward';
        // find matching edge in manual view by endpoints
        var hasSameEndpoints = function (candidate) {
            return candidate.source === latest.source
                && candidate.target === latest.target
                && (candidate.dir === dir || (!candidate.dir && !latest.dir));
        };
        var manual = manualView.edges.find(function (e) { return e.id === latest.id && hasSameEndpoints(e); });
        if (!manual) {
            manual = manualView.edges.find(function (e) { return hasSameEndpoints(e); });
        }
        if (manual) {
            return applyFromManualEdge({
                latest: latest,
                manual: manual,
            });
        }
        if (isBetweenNewLeafNodes(latest)) {
            return removeDrift(latest);
        }
        var sourceNode = nodesMap.get(latest.source);
        var targetNode = nodesMap.get(latest.target);
        // Add control points - that trigger proper edge rendering
        return makeAsStraightLine(latest, sourceNode, targetNode);
    });
    // Recalculate view bounds (around all root nodes)
    var bounds = geometry_1.BBox.merge.apply(geometry_1.BBox, nodes.filter(isRootNode));
    return (0, immer_1.produce)(latestView, function (draft) {
        draft._layout = 'manual';
        draft.nodes = (0, immer_1.castDraft)(nodes);
        draft.edges = (0, immer_1.castDraft)(edges);
        draft.bounds = bounds;
        // Clear drifts
        delete draft.drifts;
    });
}
/**
 * Padding constants for compound nodes (same as in useLayoutConstraints)
 */
var COMPOUND_PADDING = {
    Left: 42,
    Right: 42,
    Top: 60,
    Bottom: 42,
};
/**
 * Expands compound nodes to wrap all their children with proper padding.
 * Processes nodes recursively from leaves up to ensure correct bounding boxes.
 */
function expandCompoundNodes(nodes) {
    // Recursively expand compound nodes from leaves up
    function expand(nodeId) {
        var node = (0, core_1.nonNullable)(nodes.get(nodeId), "Node ".concat(nodeId, " not found"));
        if (node.children.length === 0) {
            return node;
        }
        // First expand all children
        var childBBoxes = [];
        for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
            var childId = _a[_i];
            childBBoxes.push(expand(childId));
        }
        var childrenBBox = geometry_1.BBox.merge.apply(geometry_1.BBox, childBBoxes);
        // Apply padding and update node dimensions
        node.x = childrenBBox.x - COMPOUND_PADDING.Left;
        node.y = childrenBBox.y - COMPOUND_PADDING.Top;
        node.width = childrenBBox.width + COMPOUND_PADDING.Left + COMPOUND_PADDING.Right;
        node.height = childrenBBox.height + COMPOUND_PADDING.Top + COMPOUND_PADDING.Bottom;
        return node;
    }
    // traverse root nodes, and expand compounds
    for (var _i = 0, _a = nodes.values(); _i < _a.length; _i++) {
        var node = _a[_i];
        if (!isRootNode(node) || node.children.length === 0) {
            continue;
        }
        expand(node.id);
    }
}
function applyFromManualNode(_a) {
    var latest = _a.latest, manual = _a.manual;
    (0, core_1.invariant)(manual.id === latest.id, 'Node IDs do not match');
    return (0, immer_1.produce)(latest, function (next) {
        next.x = manual.x;
        next.y = manual.y;
        // Delete drift reasons
        next.drifts = null;
    });
}
function applyFromManualEdge(edges) {
    var manual = edges.manual, latest = edges.latest;
    return (0, immer_1.produce)(latest, function (draft) {
        var _a;
        if (manual.controlPoints) {
            draft.controlPoints = manual.controlPoints;
        }
        else {
            delete draft.controlPoints;
        }
        draft.points = (0, immer_1.castDraft)(manual.points);
        if (manual.labelBBox) {
            draft.labelBBox = (_a = latest.labelBBox) !== null && _a !== void 0 ? _a : manual.labelBBox;
            // Take label position from manual layout
            draft.labelBBox.x = manual.labelBBox.x;
            draft.labelBBox.y = manual.labelBBox.y;
        }
        draft.drifts = null;
    });
}
function removeDrift(object) {
    if ('drifts' in object && object.drifts !== null) {
        var result = __assign({}, object);
        result.drifts = null;
        return result;
    }
    return object;
}
function makeAsStraightLine(edge, sourceNode, targetNode) {
    var controlPoints = edgeControlPoints(sourceNode, targetNode);
    var labelPos = controlPoints[0];
    return (0, immer_1.produce)(edge, function (draft) {
        draft.points = (0, immer_1.castDraft)((0, remeda_1.map)(controlPoints, geometry_1.convertPoint));
        draft.controlPoints = controlPoints;
        if (edge.labelBBox) {
            draft.labelBBox.x = labelPos.x;
            draft.labelBBox.y = labelPos.y;
        }
        delete draft.drifts;
    });
}
function getBorderPointOnVector(node, nodeCenter, v) {
    var xScale = node.width / 2 / v.x;
    var yScale = node.height / 2 / v.y;
    var scale = Math.min(Math.abs(xScale), Math.abs(yScale));
    return (0, geometry_1.vector)(v).multiply(scale).add(nodeCenter);
}
function edgeControlPoints(source, target) {
    var sourceCenter = (0, geometry_1.vector)(geometry_1.BBox.center(source));
    var targetCenter = (0, geometry_1.vector)(geometry_1.BBox.center(target));
    // Edge is a loop
    if (source === target) {
        var loopSize = 80;
        var centerOfTopBoundary = (0, geometry_1.vector)(0, source.height || 0)
            .multiply(-0.5)
            .add(sourceCenter);
        return [
            centerOfTopBoundary.add((0, geometry_1.vector)(-loopSize / 2.5, -loopSize)).trunc().toObject(),
            centerOfTopBoundary.add((0, geometry_1.vector)(loopSize / 2.5, -loopSize)).trunc().toObject(),
        ];
    }
    var sourceToTargetVector = targetCenter.subtract(sourceCenter);
    var sourceBorderPoint = getBorderPointOnVector(source, sourceCenter, sourceToTargetVector);
    var targetBorderPoint = getBorderPointOnVector(target, targetCenter, sourceToTargetVector.multiply(-1));
    var sourceToTarget = targetBorderPoint.subtract(sourceBorderPoint);
    return [
        sourceBorderPoint.add(sourceToTarget.multiply(0.4)).trunc().toObject(),
        sourceBorderPoint.add(sourceToTarget.multiply(0.6)).trunc().toObject(),
    ];
}
