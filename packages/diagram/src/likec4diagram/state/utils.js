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
exports.findNodeByModelFqn = void 0;
exports.typedSystem = typedSystem;
exports.findDiagramNode = findDiagramNode;
exports.findDiagramEdge = findDiagramEdge;
exports.viewBounds = viewBounds;
exports.focusedBounds = focusedBounds;
exports.activeSequenceBounds = activeSequenceBounds;
exports.nodeRef = nodeRef;
exports.findCorrespondingNode = findCorrespondingNode;
exports.calcViewportForBounds = calcViewportForBounds;
var geometry_1 = require("@likec4/core/geometry");
var utils_1 = require("@likec4/core/utils");
var system_1 = require("@xyflow/system");
var const_1 = require("../../base/const");
var view_bounds_1 = require("../../utils/view-bounds");
var findNodeByModelFqn = function (xynodes, elementFqn) {
    var node = xynodes.find(function (n) { return 'modelFqn' in n.data && n.data['modelFqn'] === elementFqn; });
    return node ? node : null;
};
exports.findNodeByModelFqn = findNodeByModelFqn;
function typedSystem(system) {
    return {
        get overlaysActorRef() {
            var _a;
            return (_a = system.get('overlays')) !== null && _a !== void 0 ? _a : null;
        },
        get diagramActorRef() {
            return (0, utils_1.nonNullable)(system.get('diagram'), 'Diagram actor not found');
        },
        get searchActorRef() {
            var _a;
            return (_a = system.get('search')) !== null && _a !== void 0 ? _a : null;
        },
        get editorActorRef() {
            var _a;
            return (_a = system.get('editor')) !== null && _a !== void 0 ? _a : null;
        },
    };
}
typedSystem.editorActor = function (_a) {
    var system = _a.system;
    return system.get('editor');
};
typedSystem.overlaysActor = function (_a) {
    var system = _a.system;
    return system.get('overlays');
};
typedSystem.diagramActor = function (_a) {
    var system = _a.system;
    return system.get('diagram');
};
typedSystem.searchActor = function (_a) {
    var system = _a.system;
    return system.get('search');
};
function findDiagramNode(ctx, xynodeId) {
    var _a;
    return (_a = ctx.view.nodes.find(function (n) { return n.id === xynodeId; })) !== null && _a !== void 0 ? _a : null;
}
function findDiagramEdge(ctx, xyedgeId) {
    var _a;
    return (_a = ctx.view.edges.find(function (e) { return e.id === xyedgeId; })) !== null && _a !== void 0 ? _a : null;
}
/**
 * Returns the bounds of the current view from the context.
 * If {@link nextView} is provided, returns the bounds of the next view.
 */
function viewBounds(ctx, nextView) {
    var view = nextView !== null && nextView !== void 0 ? nextView : ctx.view;
    return (0, view_bounds_1.pickViewBounds)(view, ctx.dynamicViewVariant);
}
function focusedBounds(params) {
    var knownAbsolutes = new Map();
    var b = params.context.xynodes.reduce(function (acc, node) {
        var _a, _b, _c, _d, _e, _f, _g;
        var position = node.position;
        if (node.parentId) {
            var parent_1 = (_a = knownAbsolutes.get(node.parentId)) !== null && _a !== void 0 ? _a : { x: 0, y: 0 };
            position = {
                x: position.x + parent_1.x,
                y: position.y + parent_1.y,
            };
        }
        knownAbsolutes.set(node.id, position);
        if (node.hidden || node.data.dimmed) {
            return acc;
        }
        var width = (_d = (_c = (_b = node.measured) === null || _b === void 0 ? void 0 : _b.width) !== null && _c !== void 0 ? _c : node.width) !== null && _d !== void 0 ? _d : node.initialWidth;
        var height = (_g = (_f = (_e = node.measured) === null || _e === void 0 ? void 0 : _e.height) !== null && _f !== void 0 ? _f : node.height) !== null && _g !== void 0 ? _g : node.initialHeight;
        acc.minX = Math.min(acc.minX, position.x);
        acc.minY = Math.min(acc.minY, position.y);
        acc.maxX = Math.max(acc.maxX, position.x + width);
        acc.maxY = Math.max(acc.maxY, position.y + height);
        return acc;
    }, {
        minX: Infinity,
        minY: Infinity,
        maxX: -Infinity,
        maxY: -Infinity,
    });
    if (b.minX === Infinity) {
        return {
            bounds: viewBounds(params.context),
        };
    }
    return {
        duration: 350,
        bounds: {
            x: b.minX - 10,
            y: b.minY - 10,
            width: b.maxX - b.minX + 20,
            height: b.maxY - b.minY + 20,
        },
    };
}
var MARGIN = 32;
function activeSequenceBounds(params) {
    var activeWalkthrough = (0, utils_1.nonNullable)(params.context.activeWalkthrough);
    var stepEdge = (0, utils_1.nonNullable)(params.context.xyedges.find(function (e) { return e.id === activeWalkthrough.stepId; }));
    var xystate = params.context.xystore.getState();
    var sourceNode = (0, utils_1.nonNullable)(xystate.nodeLookup.get(stepEdge.source));
    var targetNode = (0, utils_1.nonNullable)(xystate.nodeLookup.get(stepEdge.target));
    var actorsBounds = (0, system_1.getNodesBounds)([sourceNode, targetNode], xystate);
    var stepBounds;
    if (activeWalkthrough.parallelPrefix) {
        var parallelArea = params.context.xynodes.find(function (n) {
            return n.type === 'seq-parallel' && n.data.parallelPrefix === activeWalkthrough.parallelPrefix;
        });
        if (parallelArea) {
            stepBounds = __assign({ x: parallelArea.position.x, y: parallelArea.position.y }, (0, system_1.getNodeDimensions)(parallelArea));
        }
    }
    stepBounds !== null && stepBounds !== void 0 ? stepBounds : (stepBounds = getEdgeBounds(stepEdge, xystate));
    if (stepBounds) {
        stepBounds = geometry_1.BBox.merge(stepBounds, actorsBounds);
    }
    else {
        stepBounds = actorsBounds;
    }
    return {
        duration: 350,
        bounds: geometry_1.BBox.expand(stepBounds, MARGIN),
    };
}
function getEdgeBounds(edge, store) {
    var sourceNode = store.nodeLookup.get(edge.source);
    var targetNode = store.nodeLookup.get(edge.target);
    if (!sourceNode || !targetNode) {
        return null;
    }
    var edgePosition = (0, system_1.getEdgePosition)({
        id: edge.id,
        sourceNode: sourceNode,
        targetNode: targetNode,
        sourceHandle: edge.sourceHandle || null,
        targetHandle: edge.targetHandle || null,
        connectionMode: store.connectionMode,
    });
    if (!edgePosition) {
        return null;
    }
    return geometry_1.BBox.fromPoints([
        [edgePosition.sourceX, edgePosition.sourceY],
        [edgePosition.targetX, edgePosition.targetY],
    ]);
}
function nodeRef(node) {
    var _a;
    switch (node.type) {
        case 'element':
        case 'compound-element':
        case 'seq-actor':
            return node.data.modelFqn;
        case 'deployment':
        case 'compound-deployment':
            return (_a = node.data.modelFqn) !== null && _a !== void 0 ? _a : node.data.deploymentFqn;
        case 'seq-parallel':
        case 'view-group':
            return null;
        default:
            (0, utils_1.nonexhaustive)(node);
    }
}
function findCorrespondingNode(context, event) {
    var _a, _b;
    var fromNodeId = (_a = context.lastOnNavigate) === null || _a === void 0 ? void 0 : _a.fromNode;
    var fromNode = fromNodeId && context.xynodes.find(function (n) { return n.id === fromNodeId; });
    var fromRef = fromNode && nodeRef(fromNode);
    if (!fromNode || !fromRef) {
        return { fromNode: null, toNode: null };
    }
    var toNode = (_b = event.xynodes.find(function (n) { return nodeRef(n) === fromRef; })) !== null && _b !== void 0 ? _b : null;
    return { fromNode: fromNode, toNode: toNode };
}
function calcViewportForBounds(context, bounds) {
    var _a = context.xystore.getState(), width = _a.width, height = _a.height, transform = _a.transform;
    var maxZoom = Math.max(transform[2], 1);
    return (0, system_1.getViewportForBounds)(bounds, width, height, const_1.MinZoom, maxZoom, context.fitViewPadding);
}
