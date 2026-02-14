"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequenceLayoutToXY = sequenceLayoutToXY;
var core_1 = require("@likec4/core");
var const_1 = require("./const");
/**
 * Converts a sequence layout to XY flow nodes and edges.
 * @param view The next dynamic view which contains the sequence layout.
 * @param currentViewId The ID of the current view (optional, used to exclude navigation to the current view)
 */
function sequenceLayoutToXY(view, currentViewId) {
    var _a = view.sequenceLayout, actors = _a.actors, steps = _a.steps, compounds = _a.compounds, parallelAreas = _a.parallelAreas, bounds = _a.bounds;
    var xynodes = [];
    var xyedges = [];
    var getNode = function (id) {
        return (0, core_1.nonNullable)(view.nodes.find(function (n) { return n.id === id; }));
    };
    for (var _i = 0, compounds_1 = compounds; _i < compounds_1.length; _i++) {
        var compound = compounds_1[_i];
        xynodes.push(toCompoundArea(compound, getNode(compound.origin), view));
    }
    for (var _b = 0, parallelAreas_1 = parallelAreas; _b < parallelAreas_1.length; _b++) {
        var parallelArea = parallelAreas_1[_b];
        xynodes.push(toSeqParallelArea(parallelArea, view));
    }
    for (var _c = 0, actors_1 = actors; _c < actors_1.length; _c++) {
        var actor = actors_1[_c];
        xynodes.push(toSeqActorNode(actor, getNode(actor.id), bounds, view));
    }
    var _loop_1 = function (step) {
        var edge = view.edges.find(function (e) { return e.id === step.id; });
        if (!edge) {
            throw new Error("Edge ".concat(step.id, " not found"));
        }
        xyedges.push(toSeqStepEdge(step, edge, currentViewId !== null && currentViewId !== void 0 ? currentViewId : view.id));
    };
    for (var _d = 0, steps_1 = steps; _d < steps_1.length; _d++) {
        var step = steps_1[_d];
        _loop_1(step);
    }
    return {
        xynodes: xynodes,
        xyedges: xyedges,
    };
}
/**
 * Shows a compound as a view group node
 */
function toCompoundArea(_a, node, view) {
    var _b, _c;
    var id = _a.id, x = _a.x, y = _a.y, width = _a.width, height = _a.height, depth = _a.depth;
    return {
        id: id,
        type: 'view-group',
        data: {
            id: node.id,
            title: node.title,
            color: (_b = node.color) !== null && _b !== void 0 ? _b : 'gray',
            shape: node.shape,
            style: node.style,
            tags: node.tags,
            x: x,
            y: y,
            viewId: view.id,
            depth: depth,
            isViewGroup: true,
            drifts: (_c = node.drifts) !== null && _c !== void 0 ? _c : null,
            viewLayoutDir: 'LR',
            // Ignore notes for Compound nodes
            notes: undefined,
        },
        // zIndex: SeqZIndex.compound,
        position: {
            x: x,
            y: y,
        },
        draggable: false,
        selectable: false,
        focusable: false,
        style: {
            pointerEvents: 'none',
        },
        width: width,
        initialWidth: width,
        height: height,
        initialHeight: height,
    };
}
function toSeqParallelArea(_a, view) {
    var parallelPrefix = _a.parallelPrefix, x = _a.x, y = _a.y, width = _a.width, height = _a.height;
    return {
        id: "seq-parallel-".concat(parallelPrefix),
        type: 'seq-parallel',
        data: {
            id: "seq-parallel-".concat(parallelPrefix),
            title: 'PARALLEL',
            technology: null,
            color: const_1.SeqParallelAreaColor.default,
            shape: 'rectangle',
            style: {},
            tags: [],
            x: x,
            y: y,
            level: 0,
            icon: null,
            width: width,
            height: height,
            description: null,
            viewId: view.id,
            parallelPrefix: parallelPrefix,
            drifts: null,
            viewLayoutDir: 'LR',
            // Ignore notes for Parallel Area nodes
            notes: undefined,
        },
        zIndex: const_1.SeqZIndex.parallel,
        position: {
            x: x,
            y: y,
        },
        draggable: false,
        deletable: false,
        selectable: false,
        focusable: false,
        style: {
            pointerEvents: 'none',
        },
        width: width,
        initialWidth: width,
        height: height,
        initialHeight: height,
    };
}
function toSeqActorNode(_a, actor, bounds, view) {
    var _b, _c, _d, _e, _f, _g, _h;
    var id = _a.id, x = _a.x, y = _a.y, width = _a.width, height = _a.height, ports = _a.ports;
    return {
        id: id,
        type: 'seq-actor',
        data: {
            id: actor.id,
            x: x,
            y: y,
            level: 0,
            icon: (_b = actor.icon) !== null && _b !== void 0 ? _b : null,
            isMultiple: (_c = actor.style.multiple) !== null && _c !== void 0 ? _c : false,
            title: actor.title,
            width: width,
            height: height,
            color: actor.color,
            navigateTo: (_d = actor.navigateTo) !== null && _d !== void 0 ? _d : null,
            shape: actor.shape,
            style: actor.style,
            tags: actor.tags,
            modelFqn: (_e = actor.modelRef) !== null && _e !== void 0 ? _e : null,
            technology: (_f = actor.technology) !== null && _f !== void 0 ? _f : null,
            description: (_g = actor.description) !== null && _g !== void 0 ? _g : null,
            viewHeight: bounds.height,
            viewId: view.id,
            notes: actor.notes,
            ports: ports,
            drifts: (_h = actor.drifts) !== null && _h !== void 0 ? _h : null,
            viewLayoutDir: 'LR',
        },
        deletable: false,
        selectable: true,
        zIndex: const_1.SeqZIndex.actor,
        position: { x: x, y: y },
        width: width,
        initialWidth: width,
        height: height,
        initialHeight: height,
    };
}
function toSeqStepEdge(_a, edge, currentViewId) {
    var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    var id = _a.id, labelBBox = _a.labelBBox, sourceHandle = _a.sourceHandle, targetHandle = _a.targetHandle;
    return {
        id: id,
        type: 'seq-step',
        data: {
            id: id,
            label: edge.label,
            technology: edge.technology,
            notes: (_b = edge.notes) !== null && _b !== void 0 ? _b : null,
            navigateTo: edge.navigateTo !== currentViewId ? edge.navigateTo : null,
            controlPoints: null,
            labelBBox: {
                x: 0,
                y: 0,
                width: (_e = (_c = labelBBox === null || labelBBox === void 0 ? void 0 : labelBBox.width) !== null && _c !== void 0 ? _c : (_d = edge.labelBBox) === null || _d === void 0 ? void 0 : _d.width) !== null && _e !== void 0 ? _e : 32,
                height: (_h = (_f = labelBBox === null || labelBBox === void 0 ? void 0 : labelBBox.height) !== null && _f !== void 0 ? _f : (_g = edge.labelBBox) === null || _g === void 0 ? void 0 : _g.height) !== null && _h !== void 0 ? _h : 32,
            },
            labelXY: null,
            points: edge.points,
            color: edge.color,
            line: edge.line,
            dir: 'forward',
            head: (_j = edge.head) !== null && _j !== void 0 ? _j : 'normal',
            tail: (_k = edge.tail) !== null && _k !== void 0 ? _k : 'none',
            astPath: edge.astPath,
            drifts: (_l = edge.drifts) !== null && _l !== void 0 ? _l : null,
        },
        selectable: true,
        focusable: false,
        zIndex: 20,
        interactionWidth: 40,
        source: edge.source,
        sourceHandle: sourceHandle,
        target: edge.target,
        targetHandle: targetHandle,
    };
}
