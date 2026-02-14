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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.relationshipsBrowserLogic = exports.layouter = void 0;
var utils_1 = require("@likec4/core/utils");
var react_1 = require("@xyflow/react");
var system_1 = require("@xyflow/system");
var remeda_1 = require("remeda");
var xstate_1 = require("xstate");
var base_1 = require("../../base");
var const_1 = require("../../base/const");
var updateEdges_1 = require("../../base/updateEdges");
var updateNodes_1 = require("../../base/updateNodes");
var utils_2 = require("../../likec4diagram/state/utils");
var xyflow_1 = require("../../utils/xyflow");
var const_2 = require("./const");
var useViewToNodesEdges_1 = require("./useViewToNodesEdges");
/**
 * Root node in 'subjects' column
 */
var findRootSubject = function (nodes) {
    return nodes.find(function (n) {
        return n.data.column === 'subjects' && (0, remeda_1.isNullish)(n.parentId);
    });
};
exports.layouter = (0, xstate_1.fromPromise)(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var subjectId, navigateFromNode, xyflow, xystore, update, _c, currentNodes, width, height, next, updateXYData, parent, zoom, maxZoom, nextviewport, nextSubjectNode, currentSubjectNode, existingNode, nextSubjectCenter, currentSubjectInternalNode, currentSubjectCenter, nested, duration;
    var _d, _e, _f;
    var input = _b.input, self = _b.self, signal = _b.signal;
    return __generator(this, function (_g) {
        switch (_g.label) {
            case 0:
                subjectId = input.subjectId, navigateFromNode = input.navigateFromNode, xyflow = input.xyflow, xystore = input.xystore, update = input.update;
                _c = xystore.getState(), currentNodes = _c.nodes, width = _c.width, height = _c.height;
                next = (0, useViewToNodesEdges_1.viewToNodesEdge)(update);
                updateXYData = function () {
                    var _a = xystore.getState(), nodes = _a.nodes, edges = _a.edges;
                    return {
                        xynodes: (0, updateNodes_1.updateNodes)(nodes, next.xynodes),
                        xyedges: (0, updateEdges_1.updateEdges)(edges, next.xyedges),
                    };
                };
                parent = (0, utils_1.nonNullable)(self._parent);
                zoom = xyflow.getZoom();
                maxZoom = Math.max(zoom, 1);
                nextviewport = (0, system_1.getViewportForBounds)(update.bounds, width, height, const_1.MinZoom, maxZoom, const_2.ViewPadding);
                nextSubjectNode = (_d = next.xynodes.find(function (n) {
                    return n.type !== 'empty' && n.data.column === 'subjects' && n.data.fqn === subjectId;
                })) !== null && _d !== void 0 ? _d : findRootSubject(next.xynodes);
                currentSubjectNode = findRootSubject(currentNodes);
                existingNode = navigateFromNode
                    ? currentNodes.find(function (n) { return n.id === navigateFromNode; })
                    : currentNodes.find(function (n) { return n.type !== 'empty' && n.data.column !== 'subjects' && n.data.fqn === subjectId; });
                if (!(!nextSubjectNode || !existingNode || nextSubjectNode.type === 'empty' || !currentSubjectNode ||
                    nextSubjectNode.data.fqn === currentSubjectNode.data.fqn)) return [3 /*break*/, 2];
                return [4 /*yield*/, xyflow.setViewport(nextviewport)];
            case 1:
                _g.sent();
                return [2 /*return*/, updateXYData()];
            case 2:
                nextSubjectCenter = {
                    x: nextSubjectNode.position.x + ((_e = nextSubjectNode.initialWidth) !== null && _e !== void 0 ? _e : 0) / 2,
                    y: nextSubjectNode.position.y + ((_f = nextSubjectNode.initialHeight) !== null && _f !== void 0 ? _f : 0) / 2,
                };
                currentSubjectInternalNode = xyflow.getInternalNode(currentSubjectNode.id);
                currentSubjectCenter = (0, xyflow_1.getNodeCenter)(currentSubjectInternalNode);
                nested = new Set();
                currentNodes.forEach(function (n) {
                    if (n.id === existingNode.id) {
                        return;
                    }
                    if (n.data.column === 'subjects') {
                        nested.add(n.id);
                        return;
                    }
                    if (n.parentId && (n.parentId === existingNode.id || nested.has(n.parentId))) {
                        nested.add(n.id);
                    }
                });
                currentNodes = (0, updateNodes_1.updateNodes)(currentNodes, currentNodes.flatMap(function (n) {
                    if (nested.has(n.id)) {
                        return [];
                    }
                    if (n.id !== existingNode.id) {
                        return __assign(__assign({}, n), { data: __assign(__assign({}, n.data), { dimmed: n.data.column === 'subjects' ? 'immediate' : true }) });
                    }
                    // Move existing node
                    return __assign(__assign({}, (0, remeda_1.omit)(n, ['parentId'])), { position: {
                            x: currentSubjectCenter.x - n.initialWidth / 2,
                            y: currentSubjectCenter.y - n.initialHeight / 2,
                        }, zIndex: const_1.ZIndexes.Max, hidden: false, data: __assign(__assign({}, n.data), { dimmed: false }) });
                }));
                parent.send({
                    type: 'update.xydata',
                    xynodes: currentNodes,
                    xyedges: [],
                });
                // allow framer to render
                return [4 /*yield*/, (0, utils_1.delay)(120)];
            case 3:
                // allow framer to render
                _g.sent();
                next.xynodes = next.xynodes.map(base_1.Base.setDimmed(false));
                if (signal.aborted) {
                    return [2 /*return*/, updateXYData()];
                }
                duration = 300;
                xyflow.setCenter(currentSubjectCenter.x, currentSubjectCenter.y, { zoom: zoom, duration: duration, interpolate: 'smooth' });
                return [4 /*yield*/, (0, utils_1.delay)(duration)];
            case 4:
                _g.sent();
                return [4 /*yield*/, xyflow.setCenter(nextSubjectCenter.x, nextSubjectCenter.y, { zoom: zoom })];
            case 5:
                _g.sent();
                return [2 /*return*/, updateXYData()];
        }
    });
}); });
var machine = (0, xstate_1.setup)({
    types: {
        context: {},
        tags: '',
        children: {},
        input: {},
        events: {},
        // emitted: {} as EmittedEvents,
    },
    actors: {
        layouter: exports.layouter,
    },
    guards: {
        hasViewId: function (_a) {
            var context = _a.context;
            return context.viewId !== null;
        },
        isReady: function (_a) {
            var context = _a.context;
            return context.xyflow !== null && context.xystore !== null && context.layouted !== null;
        },
        anotherSubject: function (_a) {
            var _b;
            var context = _a.context, event = _a.event;
            if (event.type === 'update.view') {
                var subject = (_b = context.layouted) === null || _b === void 0 ? void 0 : _b.subject;
                return subject !== event.layouted.subject;
            }
            return false;
        },
    },
});
// Extracted actions
var xyflowInit = function () {
    return machine.assign(function (_a) {
        var event = _a.event;
        (0, xstate_1.assertEvent)(event, 'xyflow.init');
        return {
            xyflow: event.instance,
            xystore: event.store,
        };
    });
};
var updateView = function () {
    return machine.assign(function (_a) {
        var event = _a.event;
        (0, xstate_1.assertEvent)(event, 'update.view');
        return __assign({ layouted: event.layouted }, (0, useViewToNodesEdges_1.viewToNodesEdge)(event.layouted));
    });
};
var xyflowUpdateNodeInternals = function () {
    return machine.createAction(function (_a) {
        var context = _a.context;
        (0, utils_1.invariant)(context.xystore, 'xystore is not initialized');
        var _b = context.xystore.getState(), domNode = _b.domNode, updateNodeInternals = _b.updateNodeInternals;
        var nodeIds = new Set(context.xyedges.flatMap(function (e) { return [e.source, e.target]; }));
        if (nodeIds.size === 0 || !domNode) {
            return;
        }
        var updates = new Map();
        var domNodes = domNode.querySelectorAll('.react-flow__node');
        for (var _i = 0, domNodes_1 = domNodes; _i < domNodes_1.length; _i++) {
            var nodeElement = domNodes_1[_i];
            var nodeId = nodeElement.getAttribute('data-id');
            if (nodeId && nodeIds.has(nodeId)) {
                updates.set(nodeId, { id: nodeId, nodeElement: nodeElement, force: true });
            }
        }
        updateNodeInternals(updates, { triggerFitView: false });
    });
};
var xyflowFitDiagram = function (params) {
    return machine.createAction(function (_a) {
        var _b;
        var context = _a.context, event = _a.event;
        params !== null && params !== void 0 ? params : (params = event.type === 'fitDiagram' ? event : {});
        var _c = params !== null && params !== void 0 ? params : {}, duration = _c.duration, bounds = _c.bounds;
        duration !== null && duration !== void 0 ? duration : (duration = 450);
        var xyflow = context.xyflow, xystore = context.xystore;
        (0, utils_1.invariant)(xyflow, 'xyflow is not initialized');
        (0, utils_1.invariant)(xystore, 'xystore is not initialized');
        bounds !== null && bounds !== void 0 ? bounds : (bounds = (_b = context.layouted) === null || _b === void 0 ? void 0 : _b.bounds);
        var maxZoom = Math.max(xyflow.getZoom(), 1);
        if (bounds) {
            var _d = xystore.getState(), width = _d.width, height = _d.height;
            var viewport = (0, system_1.getViewportForBounds)(bounds, width, height, const_1.MinZoom, maxZoom, const_2.ViewPadding);
            xyflow.setViewport(viewport, duration > 0 ? { duration: duration, interpolate: 'smooth' } : undefined).catch(console.error);
        }
        else {
            xyflow.fitView(__assign({ minZoom: const_1.MinZoom, maxZoom: maxZoom, padding: const_2.ViewPadding }, (duration > 0 && { duration: duration, interpolate: 'smooth' }))).catch(console.error);
        }
    });
};
var xyflowApplyNodeChanges = function () {
    return machine.assign(function (_a) {
        var context = _a.context, event = _a.event;
        (0, xstate_1.assertEvent)(event, 'xyflow.applyNodeChanges');
        return {
            xynodes: (0, react_1.applyNodeChanges)(event.changes, context.xynodes),
        };
    });
};
var xyflowApplyEdgeChanges = function () {
    return machine.assign(function (_a) {
        var context = _a.context, event = _a.event;
        (0, xstate_1.assertEvent)(event, 'xyflow.applyEdgeChanges');
        return {
            xyedges: (0, react_1.applyEdgeChanges)(event.changes, context.xyedges),
        };
    });
};
var openRelationshipSource = function () {
    return machine.enqueueActions(function (_a) {
        var system = _a.system, event = _a.event;
        if (event.type !== 'xyflow.edgeClick') {
            return;
        }
        var diagramActor = (0, utils_2.typedSystem)(system).diagramActorRef;
        var relations = event.edge.data.relations;
        if ((0, remeda_1.hasAtLeast)(relations, 1)) {
            diagramActor.send({ type: 'open.source', relation: relations[0] });
        }
    });
};
var dispose = function () {
    return machine.assign({
        xyflow: null,
        layouted: null,
        xystore: null,
        xyedges: [],
        xynodes: [],
    });
};
var _relationshipsBrowserLogic = machine.createMachine({
    id: 'relationships-browser',
    context: function (_a) {
        var _b, _c, _d;
        var input = _a.input;
        return ({
            subject: input.subject,
            viewId: input.viewId,
            scope: input.viewId ? input.scope : 'global',
            closeable: (_b = input.closeable) !== null && _b !== void 0 ? _b : true,
            enableSelectSubject: (_c = input.enableSelectSubject) !== null && _c !== void 0 ? _c : true,
            enableChangeScope: (_d = input.enableChangeScope) !== null && _d !== void 0 ? _d : true,
            xyflow: null,
            xystore: null,
            layouted: null,
            navigateFromNode: null,
            xynodes: [],
            xyedges: [],
        });
    },
    initial: 'initializing',
    on: {
        'xyflow.applyNodeChanges': {
            actions: xyflowApplyNodeChanges(),
        },
        'xyflow.applyEdgeChanges': {
            actions: xyflowApplyEdgeChanges(),
        },
    },
    states: {
        initializing: {
            on: {
                'xyflow.init': {
                    actions: xyflowInit(),
                    target: 'isReady',
                },
                'update.view': {
                    actions: updateView(),
                    target: 'isReady',
                },
                'stop': 'closed',
                'close': 'closed',
            },
        },
        'isReady': {
            always: [{
                    guard: 'isReady',
                    actions: [
                        xyflowFitDiagram({ duration: 0 }),
                        (0, xstate_1.raise)({ type: 'xyflow.updateNodeInternals' }, { delay: 150 }),
                    ],
                    target: 'active',
                }, {
                    target: 'initializing',
                }],
        },
        'active': {
            initial: 'idle',
            tags: ['active'],
            on: {
                'xyflow.nodeClick': {
                    actions: (0, xstate_1.enqueueActions)(function (_a) {
                        var event = _a.event, enqueue = _a.enqueue;
                        if ('fqn' in event.node.data) {
                            var fqn = event.node.data.fqn;
                            enqueue.raise({
                                type: 'navigate.to',
                                subject: fqn,
                                fromNode: event.node.id,
                            });
                        }
                    }),
                },
                'xyflow.edgeClick': [
                    {
                        guard: 'hasViewId',
                        actions: (0, xstate_1.enqueueActions)(function (_a) {
                            var event = _a.event, context = _a.context, system = _a.system, enqueue = _a.enqueue;
                            if (event.edge.selected || event.edge.data.relations.length > 1
                            // (context.xyedges.some(e => e.data.dimmed === true || e.data.dimmed === 'immediate') && !event.edge.data.dimmed)
                            ) {
                                enqueue.sendTo((0, utils_2.typedSystem)(system).overlaysActorRef, {
                                    type: 'open.relationshipDetails',
                                    viewId: context.viewId,
                                    source: event.edge.data.sourceFqn,
                                    target: event.edge.data.targetFqn,
                                });
                            }
                            else {
                                enqueue(openRelationshipSource());
                            }
                        }),
                    },
                    {
                        actions: openRelationshipSource(),
                    },
                ],
                'navigate.to': {
                    actions: [
                        (0, xstate_1.assign)({
                            subject: function (_a) {
                                var event = _a.event;
                                return event.subject;
                            },
                            viewId: function (_a) {
                                var _b, _c;
                                var event = _a.event, context = _a.context;
                                return (_c = (_b = event.viewId) !== null && _b !== void 0 ? _b : context.viewId) !== null && _c !== void 0 ? _c : null;
                            },
                            navigateFromNode: function (_a) {
                                var _b;
                                var event = _a.event;
                                return (_b = event.fromNode) !== null && _b !== void 0 ? _b : null;
                            },
                        }),
                    ],
                },
                'xyflow.paneDblClick': {
                    actions: xyflowFitDiagram(),
                },
                'update.view': {
                    actions: updateView(),
                    target: '.layouting',
                },
                'change.scope': {
                    actions: (0, xstate_1.assign)({
                        scope: function (_a) {
                            var event = _a.event;
                            return event.scope;
                        },
                    }),
                },
                'xyflow.updateNodeInternals': {
                    actions: xyflowUpdateNodeInternals(),
                },
                'fitDiagram': {
                    actions: xyflowFitDiagram(),
                },
                'xyflow.resized': {
                    actions: [
                        (0, xstate_1.cancel)('fitDiagram'),
                        (0, xstate_1.raise)({ type: 'fitDiagram' }, { id: 'fitDiagram', delay: 300 }),
                    ],
                },
                'xyflow.init': {
                    actions: xyflowInit(),
                },
                'xyflow.unmount': {
                    target: 'initializing',
                },
                'close': 'closed',
            },
            states: {
                'idle': {
                    on: {
                        'xyflow.edgeMouseEnter': {
                            actions: [
                                (0, xstate_1.assign)({
                                    xyedges: function (_a) {
                                        var context = _a.context, event = _a.event;
                                        var hasDimmed = context.xyedges.some(function (edge) { return edge.data.dimmed !== false || edge.selected; });
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
                                (0, xstate_1.raise)({ type: 'dim.nonhovered.edges' }, { id: 'dim.nonhovered.edges', delay: 200 }),
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
                                    return context.xyedges.map(function (edge) {
                                        return edge.data.hovered
                                            ? edge
                                            : base_1.Base.setDimmed(edge, edge.data.dimmed === 'immediate' ? 'immediate' : true);
                                    });
                                },
                            }),
                        },
                        'undim.edges': {
                            actions: (0, xstate_1.assign)({
                                xyedges: function (_a) {
                                    var context = _a.context;
                                    // const hasSelected = context.xyedges.some(edge => edge.selected === true)
                                    // if (hasSelected) {
                                    //   return context.xyedges.map(edge =>
                                    //     Base.setDimmed(edge, edge.selected !== true ? 'immediate' : false)
                                    //   )
                                    // }
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
                    },
                },
                'layouting': {
                    invoke: {
                        id: 'layouter',
                        src: 'layouter',
                        input: function (_a) {
                            var context = _a.context;
                            return {
                                subjectId: context.subject,
                                navigateFromNode: context.navigateFromNode,
                                xyflow: (0, utils_1.nonNullable)(context.xyflow),
                                xystore: (0, utils_1.nonNullable)(context.xystore),
                                update: (0, utils_1.nonNullable)(context.layouted),
                            };
                        },
                        onDone: {
                            target: 'idle',
                            actions: (0, xstate_1.enqueueActions)(function (_a) {
                                var enqueue = _a.enqueue, event = _a.event;
                                enqueue.assign({
                                    xynodes: event.output.xynodes,
                                    xyedges: event.output.xyedges,
                                    navigateFromNode: null,
                                });
                                enqueue.raise({ type: 'fitDiagram', duration: 200 }, { id: 'fitDiagram', delay: 50 });
                                for (var i = 1; i < 8; i++) {
                                    enqueue.raise({ type: 'xyflow.updateNodeInternals' }, { delay: 120 + i * 75 });
                                }
                            }),
                        },
                    },
                    on: {
                        'update.xydata': {
                            actions: (0, xstate_1.assign)({
                                xynodes: function (_a) {
                                    var event = _a.event;
                                    return event.xynodes;
                                },
                                xyedges: function (_a) {
                                    var event = _a.event;
                                    return event.xyedges;
                                },
                            }),
                        },
                        'xyflow.applyEdgeChanges': {
                        // actions: log('layouting: ignore xyflow.applyEdgeChanges'),
                        },
                        'xyflow.applyNodeChanges': {
                        // actions: log('layouting: ignore xyflow.applyNodeChanges'),
                        },
                    },
                },
            },
        },
        closed: {
            id: 'closed',
            type: 'final',
            entry: dispose(),
        },
    },
    exit: dispose(),
});
exports.relationshipsBrowserLogic = _relationshipsBrowserLogic;
