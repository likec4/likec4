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
exports.relationshipDetailsLogic = void 0;
var core_1 = require("@likec4/core");
var react_1 = require("@xyflow/react");
var fast_equals_1 = require("fast-equals");
var remeda_1 = require("remeda");
var xstate_1 = require("xstate");
var base_1 = require("../../base");
var const_1 = require("../../base/const");
var updateEdges_1 = require("../../base/updateEdges");
var updateNodes_1 = require("../../base/updateNodes");
var utils_1 = require("../../likec4diagram/state/utils");
var layout_to_xyflow_1 = require("./layout-to-xyflow");
function inputToSubject(input) {
    if ('edgeId' in input) {
        (0, core_1.invariant)((0, remeda_1.isString)(input.edgeId), 'edgeId is required');
        return {
            edgeId: input.edgeId,
        };
    }
    return {
        source: input.source,
        target: input.target,
    };
}
var ViewPadding = {
    x: '22px',
    y: '22px',
};
var _relationshipDetailsLogic = (0, xstate_1.setup)({
    types: {
        context: {},
        input: {},
        tags: {},
        events: {},
    },
    actions: {
        'xyflow:fitDiagram': function (_a, params) {
            var context = _a.context;
            var _b = params !== null && params !== void 0 ? params : {}, duration = _b.duration, bounds = _b.bounds;
            duration !== null && duration !== void 0 ? duration : (duration = 450);
            var xyflow = context.xyflow, xystore = context.xystore;
            (0, core_1.invariant)(xyflow, 'xyflow is not initialized');
            (0, core_1.invariant)(xystore, 'xystore is not initialized');
            bounds !== null && bounds !== void 0 ? bounds : (bounds = context.bounds);
            var maxZoom = Math.max(xyflow.getZoom(), 1);
            if (bounds) {
                var _c = xystore.getState(), width = _c.width, height = _c.height;
                var viewport = (0, react_1.getViewportForBounds)(bounds, width, height, const_1.MinZoom, maxZoom, ViewPadding);
                xyflow.setViewport(viewport, duration > 0 ? { duration: duration } : undefined).catch(console.error);
            }
            else {
                xyflow.fitView(__assign({ minZoom: const_1.MinZoom, maxZoom: maxZoom, padding: ViewPadding }, (duration > 0 && { duration: duration, interpolate: 'smooth' }))).catch(console.error);
            }
        },
        'xyflow:updateNodeInternals': function (_a) {
            var context = _a.context;
            (0, core_1.invariant)(context.xystore, 'xystore is not initialized');
            var _b = context.xystore.getState(), domNode = _b.domNode, updateNodeInternals = _b.updateNodeInternals;
            var nodeIds = new Set(context.xyedges.flatMap(function (e) { return [e.source, e.target]; }));
            if (nodeIds.size === 0 || !domNode) {
                return;
            }
            var updates = new Map();
            for (var _i = 0, nodeIds_1 = nodeIds; _i < nodeIds_1.length; _i++) {
                var updateId = nodeIds_1[_i];
                var nodeElement = domNode.querySelector(".react-flow__node[data-id=\"".concat(updateId, "\"]"));
                if (nodeElement) {
                    updates.set(updateId, { id: updateId, nodeElement: nodeElement, force: true });
                }
            }
            updateNodeInternals(updates, { triggerFitView: false });
        },
        'updateXYFlow': (0, xstate_1.assign)(function (_a) {
            var context = _a.context, event = _a.event;
            (0, xstate_1.assertEvent)(event, 'xyflow.init');
            var initialized = context.initialized;
            if (!initialized.xyflow) {
                initialized = __assign(__assign({}, initialized), { xyflow: true });
            }
            return {
                initialized: initialized,
                xyflow: event.instance,
                xystore: event.store,
            };
        }),
        'updateLayoutData': (0, xstate_1.assign)(function (_a) {
            var context = _a.context, event = _a.event;
            (0, xstate_1.assertEvent)(event, 'update.layoutData');
            var _b = (0, layout_to_xyflow_1.layoutResultToXYFlow)(event.data), xynodes = _b.xynodes, xyedges = _b.xyedges, bounds = _b.bounds;
            var initialized = context.initialized;
            if (!initialized.xydata) {
                initialized = __assign(__assign({}, initialized), { xydata: true });
            }
            return {
                initialized: initialized,
                xynodes: (0, updateNodes_1.updateNodes)(context.xynodes, xynodes),
                xyedges: (0, updateEdges_1.updateEdges)(context.xyedges, xyedges),
                bounds: (0, fast_equals_1.shallowEqual)(context.bounds, bounds) ? context.bounds : bounds,
            };
        }),
        'open relationship source': (0, xstate_1.enqueueActions)(function (_a) {
            var system = _a.system, event = _a.event;
            if (event.type !== 'xyflow.edgeClick') {
                return;
            }
            var diagramActor = (0, utils_1.typedSystem)(system).diagramActorRef;
            var relationId = event.edge.data.relationId;
            if (relationId) {
                diagramActor.send({ type: 'open.source', relation: relationId });
            }
        }),
    },
    guards: {
        'isReady': function (_a) {
            var context = _a.context;
            return context.initialized.xydata && context.initialized.xyflow;
        },
        'enable: navigate.to': function () { return true; },
    },
}).createMachine({
    initial: 'initializing',
    context: function (_a) {
        var input = _a.input;
        return ({
            subject: inputToSubject(input),
            viewId: input.viewId,
            bounds: {
                x: 0,
                y: 0,
                width: 200,
                height: 200,
            },
            initialized: {
                xydata: false,
                xyflow: false,
            },
            xyflow: null,
            xystore: null,
            xynodes: [],
            xyedges: [],
        });
    },
    states: {
        'initializing': {
            on: {
                'xyflow.init': {
                    actions: 'updateXYFlow',
                    target: 'isReady',
                },
                'update.layoutData': {
                    actions: 'updateLayoutData',
                    target: 'isReady',
                },
                'close': {
                    target: 'closed',
                },
            },
        },
        'isReady': {
            always: [{
                    guard: 'isReady',
                    actions: [
                        { type: 'xyflow:fitDiagram', params: { duration: 0 } },
                        (0, xstate_1.raise)({ type: 'xyflow.updateNodeInternals' }, { delay: 50 }),
                    ],
                    target: 'ready',
                }, {
                    target: 'initializing',
                }],
        },
        'ready': {
            on: {
                'xyflow.edgeMouseEnter': {
                    actions: [
                        (0, xstate_1.assign)({
                            xyedges: function (_a) {
                                var context = _a.context, event = _a.event;
                                var hasDimmed = context.xyedges.some(function (edge) {
                                    return edge.data.dimmed === true || edge.data.dimmed === 'immediate';
                                });
                                return context.xyedges.map(function (edge) {
                                    if (edge.id === event.edge.id) {
                                        return base_1.Base.setData(edge, {
                                            hovered: true,
                                            dimmed: false,
                                        });
                                    }
                                    return hasDimmed && !edge.selected ? base_1.Base.setDimmed(edge, 'immediate') : edge;
                                });
                            },
                        }),
                        (0, xstate_1.cancel)('undim.edges'),
                        (0, xstate_1.cancel)('dim.nonhovered.edges'),
                        (0, xstate_1.raise)({ type: 'dim.nonhovered.edges' }, { id: 'dim.nonhovered.edges', delay: 100 }),
                    ],
                },
                'xyflow.edgeMouseLeave': {
                    actions: [
                        (0, xstate_1.assign)({
                            xyedges: function (_a) {
                                var context = _a.context, event = _a.event;
                                return context.xyedges.map(function (edge) {
                                    if (edge.id === event.edge.id) {
                                        return base_1.Base.setHovered(edge, false);
                                    }
                                    return edge;
                                });
                            },
                        }),
                        (0, xstate_1.cancel)('dim.nonhovered.edges'),
                        (0, xstate_1.raise)({ type: 'undim.edges' }, { id: 'undim.edges', delay: 400 }),
                    ],
                },
                'dim.nonhovered.edges': {
                    actions: (0, xstate_1.assign)({
                        xyedges: function (_a) {
                            var context = _a.context;
                            return context.xyedges.map(function (edge) { return base_1.Base.setDimmed(edge, edge.data.hovered !== true); });
                        },
                    }),
                },
                'undim.edges': {
                    actions: (0, xstate_1.assign)({
                        xyedges: function (_a) {
                            var context = _a.context;
                            var hasSelected = context.xyedges.some(function (edge) { return edge.selected === true; });
                            if (hasSelected) {
                                return context.xyedges.map(function (edge) {
                                    return base_1.Base.setDimmed(edge, edge.selected !== true ? edge.data.dimmed || 'immediate' : false);
                                });
                            }
                            return context.xyedges.map(base_1.Base.setDimmed(false));
                        },
                    }),
                },
                'xyflow.selectionChange': {
                    actions: (0, xstate_1.enqueueActions)(function (_a) {
                        var event = _a.event, context = _a.context, enqueue = _a.enqueue;
                        if (event.edges.length === 0 && context.xyedges.some(function (e) { return e.data.dimmed; }) &&
                            !context.xyedges.some(function (e) { return e.data.hovered; })) {
                            enqueue.raise({ type: 'undim.edges' });
                        }
                    }),
                },
                'update.layoutData': {
                    actions: [
                        'updateLayoutData',
                        (0, xstate_1.cancel)('fitDiagram'),
                        (0, xstate_1.raise)({ type: 'fitDiagram', duration: 0 }, { id: 'fitDiagram', delay: 50 }),
                        (0, xstate_1.raise)({ type: 'xyflow.updateNodeInternals' }, { delay: 75 }),
                    ],
                },
                'xyflow.init': {
                    actions: 'updateXYFlow',
                },
                'xyflow.applyNodeChanges': {
                    actions: (0, xstate_1.assign)({
                        xynodes: function (_a) {
                            var context = _a.context, event = _a.event;
                            return (0, react_1.applyNodeChanges)(event.changes, context.xynodes);
                        },
                    }),
                },
                'xyflow.applyEdgeChanges': {
                    actions: (0, xstate_1.assign)({
                        xyedges: function (_a) {
                            var context = _a.context, event = _a.event;
                            return (0, react_1.applyEdgeChanges)(event.changes, context.xyedges);
                        },
                    }),
                },
                'xyflow.paneDblClick': {
                    actions: 'xyflow:fitDiagram',
                },
                'xyflow.edgeClick': {
                    actions: 'open relationship source',
                },
                'navigate.to': {
                    actions: (0, xstate_1.assign)({
                        subject: function (_a) {
                            var event = _a.event;
                            return inputToSubject(event.params);
                        },
                        viewId: function (_a) {
                            var _b;
                            var context = _a.context, event = _a.event;
                            return (_b = event.params.viewId) !== null && _b !== void 0 ? _b : context.viewId;
                        },
                    }),
                },
                'close': {
                    target: 'closed',
                },
            },
            exit: (0, xstate_1.assign)({
                xyedges: [],
                xynodes: [],
                initialized: {
                    xydata: false,
                    xyflow: false,
                },
                xyflow: null,
                xystore: null,
            }),
        },
        'closed': {
            type: 'final',
        },
    },
    on: {
        'fitDiagram': {
            actions: {
                type: 'xyflow:fitDiagram',
                params: (0, remeda_1.prop)('event'),
            },
        },
        'xyflow.resized': {
            actions: [
                (0, xstate_1.cancel)('fitDiagram'),
                (0, xstate_1.raise)({ type: 'fitDiagram' }, { id: 'fitDiagram', delay: 200 }),
            ],
        },
        'xyflow.updateNodeInternals': {
            actions: 'xyflow:updateNodeInternals',
        },
    },
});
exports.relationshipDetailsLogic = _relationshipDetailsLogic;
