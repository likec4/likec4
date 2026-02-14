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
exports.returnViewportBefore = exports.assignViewportBefore = exports.raiseUpdateView = exports.raiseFitDiagram = exports.cancelFitDiagram = exports.raiseSetViewport = exports.fitFocusedBounds = exports.fitDiagram = exports.centerOnNodeOrEdge = exports.setViewportCenter = exports.setViewport = void 0;
// oxlint-disable triple-slash-reference
// oxlint-disable no-floating-promises
/// <reference path="../../../node_modules/xstate/dist/declarations/src/guards.d.ts" />
var core_1 = require("@likec4/core");
var react_1 = require("@xyflow/react");
var xstate_1 = require("xstate");
var base_1 = require("../../base");
var view_bounds_1 = require("../../utils/view-bounds");
var machine_setup_1 = require("./machine.setup");
var utils_1 = require("./utils");
var setViewport = function (params) {
    return machine_setup_1.machine.createAction(function (_a) {
        var context = _a.context, event = _a.event;
        var viewport, duration;
        if (params) {
            viewport = params.viewport;
            duration = params.duration;
        }
        else {
            (0, xstate_1.assertEvent)(event, 'xyflow.setViewport');
            viewport = event.viewport;
            duration = event.duration;
        }
        duration = duration !== null && duration !== void 0 ? duration : 450;
        var panZoom = (0, core_1.nonNullable)(context.xystore).getState().panZoom;
        var animationProps = duration > 0 ? { duration: duration, interpolate: 'smooth' } : undefined;
        panZoom === null || panZoom === void 0 ? void 0 : panZoom.setViewport({
            x: Math.round(viewport.x),
            y: Math.round(viewport.y),
            zoom: viewport.zoom,
        }, animationProps).catch(function (err) {
            console.error('Error during setViewport', { err: err });
        });
    });
};
exports.setViewport = setViewport;
var setViewportCenter = function (params) {
    return machine_setup_1.machine.createAction(function (_a) {
        var context = _a.context, event = _a.event;
        var center;
        if (params) {
            center = params;
        }
        else if (event.type === 'update.view') {
            center = core_1.BBox.center((0, utils_1.viewBounds)(context, event.view));
        }
        else {
            center = core_1.BBox.center((0, utils_1.viewBounds)(context));
        }
        (0, core_1.invariant)(context.xyflow, 'xyflow is not initialized');
        var zoom = context.xyflow.getZoom();
        context.xyflow.setCenter(Math.round(center.x), Math.round(center.y), { zoom: zoom }).catch(function (err) {
            console.error('Error during setViewportCenter', { err: err });
        });
    });
};
exports.setViewportCenter = setViewportCenter;
var centerOnNodeOrEdge = function () {
    return machine_setup_1.machine.raise(function (_a) {
        var _b;
        var context = _a.context, event = _a.event;
        (0, xstate_1.assertEvent)(event, 'xyflow.centerViewport');
        var xystate = context.xystore.getState();
        if ('edgeId' in event) {
            var edge = xystate.edgeLookup.get(event.edgeId);
            if (!edge) {
                return { type: 'noop' };
            }
            var sourceNode = xystate.nodeLookup.get(edge.source);
            var targetNode = xystate.nodeLookup.get(edge.target);
            if (!sourceNode || !targetNode) {
                return { type: 'noop' };
            }
            var bounds_1 = (0, react_1.getNodesBounds)([sourceNode, targetNode], xystate);
            var edgeBounds = (0, view_bounds_1.calcEdgeBounds)({
                points: edge.data.points,
                controlPoints: edge.data.controlPoints && (0, core_1.isNonEmptyArray)(edge.data.controlPoints)
                    ? edge.data.controlPoints
                    : null,
                labelBBox: (_b = edge.data.labelBBox) !== null && _b !== void 0 ? _b : null,
            });
            return {
                type: 'xyflow.fitDiagram',
                bounds: core_1.BBox.merge(bounds_1, edgeBounds),
            };
        }
        var node = xystate.nodeLookup.get(event.nodeId);
        if (!node) {
            return { type: 'noop' };
        }
        var bounds = (0, react_1.getNodesBounds)([node], xystate);
        return {
            type: 'xyflow.fitDiagram',
            bounds: bounds,
        };
    });
};
exports.centerOnNodeOrEdge = centerOnNodeOrEdge;
var fitDiagram = function (params) {
    return machine_setup_1.machine.createAction(function (_a) {
        var context = _a.context, event = _a.event;
        var bounds, duration;
        if (params) {
            bounds = params.bounds;
            duration = params.duration;
        }
        else if (event.type === 'xyflow.fitDiagram') {
            bounds = event.bounds;
            duration = event.duration;
        }
        // Default values
        bounds !== null && bounds !== void 0 ? bounds : (bounds = (0, utils_1.viewBounds)(context));
        duration !== null && duration !== void 0 ? duration : (duration = 450);
        var _b = (0, core_1.nonNullable)(context.xystore).getState(), width = _b.width, height = _b.height, panZoom = _b.panZoom, transform = _b.transform;
        var maxZoom = Math.max(1, transform[2]);
        var viewport = (0, react_1.getViewportForBounds)(bounds, width, height, base_1.MinZoom, maxZoom, context.fitViewPadding);
        viewport.x = Math.round(viewport.x);
        viewport.y = Math.round(viewport.y);
        var animationProps = duration > 0 ? { duration: duration, interpolate: 'smooth' } : undefined;
        panZoom === null || panZoom === void 0 ? void 0 : panZoom.setViewport(viewport, animationProps).catch(function (err) {
            console.error('Error during fitDiagram panZoom setViewport', { err: err });
        });
    });
};
exports.fitDiagram = fitDiagram;
var fitFocusedBounds = function () {
    return machine_setup_1.machine.createAction(function (_a) {
        var context = _a.context;
        var isActiveSequenceWalkthrough = !!context.activeWalkthrough && context.dynamicViewVariant === 'sequence';
        var _b = isActiveSequenceWalkthrough
            ? (0, utils_1.activeSequenceBounds)({ context: context })
            : (0, utils_1.focusedBounds)({ context: context }), bounds = _b.bounds, _c = _b.duration, duration = _c === void 0 ? 450 : _c;
        var _d = (0, core_1.nonNullable)(context.xystore).getState(), width = _d.width, height = _d.height, panZoom = _d.panZoom, transform = _d.transform;
        var maxZoom = Math.max(1, transform[2]);
        var viewport = (0, react_1.getViewportForBounds)(bounds, width, height, base_1.MinZoom, maxZoom, context.fitViewPadding);
        viewport.x = Math.round(viewport.x);
        viewport.y = Math.round(viewport.y);
        var animationProps = duration > 0 ? { duration: duration, interpolate: 'smooth' } : undefined;
        panZoom === null || panZoom === void 0 ? void 0 : panZoom.setViewport(viewport, animationProps).catch(function (err) {
            console.error('Error during fitFocusedBounds panZoom setViewport', { err: err });
        });
    });
};
exports.fitFocusedBounds = fitFocusedBounds;
var DEFAULT_DELAY = 30;
var raiseSetViewport = function (params) {
    var _a = params !== null && params !== void 0 ? params : {}, _b = _a.delay, delay = _b === void 0 ? DEFAULT_DELAY : _b, rest = __rest(_a, ["delay"]);
    return machine_setup_1.machine.raise(__assign({ type: 'xyflow.setViewport' }, rest), {
        id: 'fitDiagram',
        delay: delay,
    });
};
exports.raiseSetViewport = raiseSetViewport;
var cancelFitDiagram = function () { return machine_setup_1.machine.cancel('fitDiagram'); };
exports.cancelFitDiagram = cancelFitDiagram;
var raiseFitDiagram = function (params) {
    var _a = params !== null && params !== void 0 ? params : {}, _b = _a.delay, delay = _b === void 0 ? DEFAULT_DELAY : _b, rest = __rest(_a, ["delay"]);
    return machine_setup_1.machine.raise(__assign({ type: 'xyflow.fitDiagram' }, rest), {
        id: 'fitDiagram',
        delay: delay,
    });
};
exports.raiseFitDiagram = raiseFitDiagram;
var raiseUpdateView = function (view) {
    return machine_setup_1.machine.raise(function (_a) {
        var context = _a.context;
        return ({
            type: 'update.view',
            view: view !== null && view !== void 0 ? view : context.view,
        });
    }, { delay: DEFAULT_DELAY });
};
exports.raiseUpdateView = raiseUpdateView;
var assignViewportBefore = function (viewport) {
    return machine_setup_1.machine.assign(function (_a) {
        var context = _a.context;
        // Assign to indicate that there is no need to restore viewports
        if (viewport === false) {
            return ({
                viewportBefore: null,
            });
        }
        return {
            // We can assign
            viewportBefore: {
                wasChangedManually: context.viewportChangedManually,
                value: viewport !== null && viewport !== void 0 ? viewport : __assign({}, context.viewport),
            },
        };
    });
};
exports.assignViewportBefore = assignViewportBefore;
var returnViewportBefore = function (params) {
    return machine_setup_1.machine.enqueueActions(function (_a) {
        var enqueue = _a.enqueue, viewportBefore = _a.context.viewportBefore;
        enqueue((0, exports.cancelFitDiagram)());
        var noDelay = (params === null || params === void 0 ? void 0 : params.delay) === 0;
        if (viewportBefore) {
            enqueue.assign({
                viewportChangedManually: viewportBefore.wasChangedManually,
                viewportBefore: null,
            });
            if (noDelay) {
                enqueue((0, exports.setViewport)(__assign({ viewport: viewportBefore.value }, params)));
            }
            else {
                enqueue((0, exports.raiseSetViewport)(__assign({ viewport: viewportBefore.value }, params)));
            }
        }
        else {
            if (noDelay) {
                enqueue((0, exports.fitDiagram)(__assign({}, params)));
            }
            else {
                enqueue((0, exports.raiseFitDiagram)(__assign({}, params)));
            }
        }
    });
};
exports.returnViewportBefore = returnViewportBefore;
