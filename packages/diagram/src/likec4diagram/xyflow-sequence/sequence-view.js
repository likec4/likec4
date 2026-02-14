"use strict";
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
exports.sequenceViewToXY = sequenceViewToXY;
var types_1 = require("@likec4/core/types");
var utils_1 = require("@likec4/core/utils");
var remeda_1 = require("remeda");
var roundDpr_1 = require("../../utils/roundDpr");
var xyflow_1 = require("../../utils/xyflow");
var const_1 = require("./const");
var layouter_1 = require("./layouter");
var utils_2 = require("./utils");
function sequenceViewToXY(view) {
    var _a;
    var actors = [];
    var actorPorts = new utils_1.DefaultMap(function () { return []; });
    var steps = [];
    var getNode = function (id) { return (0, utils_1.nonNullable)(view.nodes.find(function (n) { return n.id === id; })); };
    var addActor = function () {
        var _a = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            _a[_i] = arguments[_i];
        }
        var source = _a[0], target = _a[1];
        // source actor not yet added
        if (!actors.includes(source)) {
            var indexOfTarget = actors.indexOf(target);
            if (indexOfTarget > 0) {
                actors.splice(indexOfTarget, 0, source);
            }
            else {
                actors.push(source);
            }
        }
        if (!actors.includes(target)) {
            actors.push(target);
        }
    };
    var row = 0;
    for (var _i = 0, _b = view.edges.filter(function (e) { return (0, types_1.isStepEdgeId)(e.id); }); _i < _b.length; _i++) {
        var edge = _b[_i];
        var prevStep = steps.at(-1);
        var source = getNode(edge.source);
        var target = getNode(edge.target);
        if (source.children.length || target.children.length) {
            console.error('Sequence view does not support nested actors');
            continue;
        }
        var sourceColumn = actors.indexOf(source);
        var targetColumn = actors.indexOf(target);
        var alreadyAdded = sourceColumn >= 0 && targetColumn >= 0;
        if (!alreadyAdded) {
            if (edge.dir === 'back') {
                addActor(target, source);
            }
            else {
                addActor(source, target);
            }
            sourceColumn = actors.indexOf(source);
            targetColumn = actors.indexOf(target);
        }
        var isSelfLoop = source === target;
        var isBack = sourceColumn > targetColumn;
        var parallelPrefix = (0, types_1.getParallelStepsPrefix)(edge.id);
        var isContinuing = false;
        if (prevStep && prevStep.target == source && prevStep.parallelPrefix === parallelPrefix) {
            isContinuing = prevStep.isSelfLoop !== isSelfLoop || prevStep.isBack === isBack;
        }
        if (!isContinuing) {
            row++;
        }
        var step = {
            id: edge.id,
            from: {
                column: sourceColumn,
                row: row,
            },
            to: {
                column: targetColumn,
                row: isSelfLoop ? ++row : row,
            },
            edge: edge,
            isSelfLoop: isSelfLoop,
            isBack: isBack,
            parallelPrefix: parallelPrefix,
            offset: isContinuing ? ((_a = prevStep === null || prevStep === void 0 ? void 0 : prevStep.offset) !== null && _a !== void 0 ? _a : 0) + const_1.CONTINUOUS_OFFSET : 0,
            source: source,
            target: target,
            label: edge.labelBBox
                ? {
                    height: edge.labelBBox.height + 8 + (edge.navigateTo ? 20 : 0),
                    width: edge.labelBBox.width + 16,
                    text: edge.label,
                }
                : null,
        };
        steps.push(step);
        actorPorts.get(source).push({ step: step, row: row, type: 'source', position: isBack && !isSelfLoop ? 'left' : 'right' });
        actorPorts.get(target).push({ step: step, row: row, type: 'target', position: isBack || isSelfLoop ? 'right' : 'left' });
    }
    // Update columns, as actors may have been re-ordered
    for (var _c = 0, steps_1 = steps; _c < steps_1.length; _c++) {
        var step = steps_1[_c];
        step.from.column = actors.indexOf(step.source);
        step.to.column = actors.indexOf(step.target);
    }
    (0, utils_1.invariant)((0, remeda_1.hasAtLeast)(actors, 1), 'actors array must not be empty');
    var layout = new layouter_1.SequenceViewLayouter({
        actors: actors,
        steps: steps,
        compounds: (0, utils_2.buildCompounds)(actors, view.nodes),
    });
    var bounds = layout.getViewBounds();
    return {
        bounds: bounds,
        xynodes: __spreadArray(__spreadArray(__spreadArray([], layout.getCompoundBoxes().map(function (box, i) { return toCompoundArea(box, i, view); }), true), layout.getParallelBoxes().map(function (box) { return toSeqParallelArea(box, view); }), true), actors.map(function (actor) {
            return toSeqActorNode({
                actor: actor,
                ports: actorPorts.get(actor),
                bounds: bounds,
                layout: layout,
                view: view,
            });
        }), true),
        xyedges: steps.map(function (_a) {
            var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
            var id = _a.id, edge = _a.edge, step = __rest(_a, ["id", "edge"]);
            return ({
                id: id,
                type: 'seq-step',
                data: {
                    id: id,
                    label: (_c = (_b = step.label) === null || _b === void 0 ? void 0 : _b.text) !== null && _c !== void 0 ? _c : null,
                    technology: edge.technology,
                    notes: (_d = edge.notes) !== null && _d !== void 0 ? _d : null,
                    navigateTo: edge.navigateTo,
                    controlPoints: (_e = edge.controlPoints) !== null && _e !== void 0 ? _e : null,
                    labelBBox: {
                        x: 0,
                        y: 0,
                        width: (_j = (_g = (_f = step.label) === null || _f === void 0 ? void 0 : _f.width) !== null && _g !== void 0 ? _g : (_h = edge.labelBBox) === null || _h === void 0 ? void 0 : _h.width) !== null && _j !== void 0 ? _j : 32,
                        height: (_o = (_l = (_k = step.label) === null || _k === void 0 ? void 0 : _k.height) !== null && _l !== void 0 ? _l : (_m = edge.labelBBox) === null || _m === void 0 ? void 0 : _m.height) !== null && _o !== void 0 ? _o : 32,
                    },
                    labelXY: null,
                    points: edge.points,
                    color: (_p = edge.color) !== null && _p !== void 0 ? _p : 'gray',
                    line: (_q = edge.line) !== null && _q !== void 0 ? _q : 'dashed',
                    dir: 'forward',
                    head: (_r = edge.head) !== null && _r !== void 0 ? _r : 'normal',
                    tail: (_s = edge.tail) !== null && _s !== void 0 ? _s : 'none',
                    astPath: edge.astPath,
                    drifts: (_t = edge.drifts) !== null && _t !== void 0 ? _t : null,
                },
                focusable: false,
                zIndex: 20,
                interactionWidth: 40,
                source: step.source.id,
                sourceHandle: id + '_source',
                target: step.target.id,
                targetHandle: id + '_target',
            });
        }),
    };
}
/**
 * Shows a compound as a view group node
 */
function toCompoundArea(_a, index, view) {
    var _b, _c;
    var node = _a.node, x = _a.x, y = _a.y, width = _a.width, height = _a.height, depth = _a.depth;
    return {
        id: "".concat(node.id, "-").concat(index),
        type: 'view-group',
        data: {
            id: node.id,
            title: node.title,
            color: (_b = node.color) !== null && _b !== void 0 ? _b : 'gray',
            shape: node.shape,
            style: node.style,
            tags: node.tags,
            notes: node.notes,
            x: x,
            y: y,
            viewId: view.id,
            depth: depth,
            isViewGroup: true,
            drifts: (_c = node.drifts) !== null && _c !== void 0 ? _c : null,
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
            width: width,
            height: height,
        },
        initialWidth: width,
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
            notes: undefined,
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
        },
        zIndex: const_1.SeqZIndex.parallel,
        position: {
            x: x,
            y: y,
        },
        selectable: false,
        focusable: false,
        style: {
            pointerEvents: 'none',
            width: width,
            height: height,
        },
        initialWidth: width,
        initialHeight: height,
    };
}
function toSeqActorNode(_a) {
    var _b, _c, _d, _e, _f, _g, _h, _j;
    var actor = _a.actor, _ports = _a.ports, bounds = _a.bounds, layout = _a.layout, view = _a.view;
    var _k = layout.getActorBox(actor), x = _k.x, y = _k.y, width = _k.width, height = _k.height;
    var _l = _ports.reduce(function (acc, p) {
        var bbox = layout.getPortCenter(p.step, p.type);
        acc.ports.push({
            id: p.step.id + '_' + p.type,
            cx: (0, roundDpr_1.roundDpr)(bbox.cx - x),
            cy: (0, roundDpr_1.roundDpr)(bbox.cy - y),
            height: bbox.height,
            type: p.type,
            position: p.position,
        });
        acc.handles.push({
            id: p.step.id + '_' + p.type,
            position: (0, xyflow_1.toXYFlowPosition)(p.position),
            x: bbox.cx,
            y: bbox.cy,
            width: 5,
            height: bbox.height,
            type: p.type,
        });
        return acc;
    }, {
        ports: [],
        handles: [],
    }), ports = _l.ports, handles = _l.handles;
    return {
        id: actor.id,
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
            ports: ports,
            drifts: (_h = actor.drifts) !== null && _h !== void 0 ? _h : null,
            notes: (_j = actor.notes) !== null && _j !== void 0 ? _j : undefined,
        },
        handles: handles,
        zIndex: const_1.SeqZIndex.actor,
        position: { x: x, y: y },
        style: {
            width: width,
            height: height,
        },
        initialWidth: width,
        initialHeight: height,
    };
}
