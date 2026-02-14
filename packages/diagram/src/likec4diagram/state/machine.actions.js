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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
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
exports.updateView = exports.handleNavigate = exports.cancelAutoUnfocusTimer = exports.startAutoUnfocusTimer = exports.stopHotKeyActor = exports.startHotKeyActor = exports.reraise = exports.onEdgeMouseLeave = exports.onEdgeMouseEnter = exports.ensureSearchActor = exports.ensureOverlaysActor = exports.openSourceOfFocusedOrLastClickedNode = exports.openOverlay = exports.openElementDetails = exports.cancelEditing = exports.stopEditing = exports.sendSynced = exports.startEditing = exports.ensureEditorActor = exports.stopEditorActor = exports.closeAllOverlays = exports.closeSearch = exports.assignToggledFeatures = exports.highlightNodeOrEdge = exports.tagHighlight = exports.notationsHighlight = exports.resetEdgesControlPoints = exports.layoutAlign = exports.emitOnLayoutTypeChange = exports.triggerChange = exports.emitEdgeClick = exports.emitNavigateTo = exports.emitNodeClick = exports.emitInitialized = exports.emitOpenSourceOfView = exports.emitOpenSource = exports.emitPaneClick = exports.onNodeMouseLeave = exports.onNodeMouseEnter = exports.assignDynamicViewVariant = exports.undimEverything = exports.focusOnNodesAndEdges = exports.assignXYDataFromView = exports.updateInputs = exports.updateFeatures = exports.resetLastClickedNode = exports.assignFocusedNode = exports.assignLastClickedNode = exports.onEdgeDoubleClick = exports.disableCompareWithLatest = void 0;
// oxlint-disable triple-slash-reference
// oxlint-disable no-floating-promises
var core_1 = require("@likec4/core");
var geometry_1 = require("@likec4/core/geometry");
var utils_1 = require("@likec4/core/utils");
var system_1 = require("@xyflow/system");
var immer_1 = require("immer");
var remeda_1 = require("remeda");
var xstate_1 = require("xstate");
var base_1 = require("../../base");
var convert_to_xyflow_1 = require("../convert-to-xyflow");
var useLayoutConstraints_1 = require("../useLayoutConstraints");
var aligners_1 = require("./aligners");
var assign_1 = require("./assign");
var machine_actions_layout_1 = require("./machine.actions.layout");
var machine_setup_1 = require("./machine.setup");
var utils_2 = require("./utils");
__exportStar(require("./machine.actions.layout"), exports);
var disableCompareWithLatest = function () {
    return machine_setup_1.machine.assign(function (_a) {
        var context = _a.context;
        return {
            toggledFeatures: __assign(__assign({}, context.toggledFeatures), { enableCompareWithLatest: false }),
            viewportOnAutoLayout: null,
            viewportOnManualLayout: null,
        };
    });
};
exports.disableCompareWithLatest = disableCompareWithLatest;
var onEdgeDoubleClick = function () {
    return machine_setup_1.machine.assign(function (_a) {
        var context = _a.context, event = _a.event;
        (0, xstate_1.assertEvent)(event, 'xyflow.edgeDoubleClick');
        if (!event.edge.data.controlPoints) {
            return {};
        }
        var nodeLookup = context.xystore.getState().nodeLookup;
        return {
            xyedges: context.xyedges.map(function (e) {
                if (e.id !== event.edge.id) {
                    return e;
                }
                var controlPoints = (0, assign_1.resetEdgeControlPoints)(nodeLookup, e);
                var pt = controlPoints[0];
                return __assign(__assign({}, e), { data: __assign(__assign({}, e.data), { controlPoints: controlPoints, labelBBox: e.data.labelBBox ? __assign(__assign({}, e.data.labelBBox), pt) : null, labelXY: null }) });
            }),
        };
    });
};
exports.onEdgeDoubleClick = onEdgeDoubleClick;
// Simple assign actions that don't depend on others
var assignLastClickedNode = function () {
    return machine_setup_1.machine.assign(function (_a) {
        var context = _a.context, event = _a.event;
        (0, xstate_1.assertEvent)(event, 'xyflow.nodeClick');
        var lastClickedNode = context.lastClickedNode;
        if (!lastClickedNode || lastClickedNode.id !== event.node.id) {
            return {
                lastClickedNode: {
                    id: event.node.id,
                    clicks: 1,
                    timestamp: Date.now(),
                },
            };
        }
        return {
            lastClickedNode: {
                id: lastClickedNode.id,
                clicks: lastClickedNode.clicks + 1,
                timestamp: Date.now(),
            },
        };
    });
};
exports.assignLastClickedNode = assignLastClickedNode;
var assignFocusedNode = function () {
    return machine_setup_1.machine.assign(function (_a) {
        var event = _a.event;
        var focusedNode;
        var autoUnfocusTimer = false;
        switch (event.type) {
            case 'xyflow.nodeClick':
                focusedNode = event.node.data.id;
                break;
            case 'focus.node': {
                focusedNode = event.nodeId;
                autoUnfocusTimer = event.autoUnfocus === true;
                break;
            }
            default:
                throw new Error("Unexpected event type: ".concat(event.type, " in action 'assign: focusedNode'"));
        }
        return {
            focusedNode: focusedNode,
            autoUnfocusTimer: autoUnfocusTimer,
        };
    });
};
exports.assignFocusedNode = assignFocusedNode;
var resetLastClickedNode = function () {
    return machine_setup_1.machine.assign(function () { return ({
        lastClickedNode: null,
    }); });
};
exports.resetLastClickedNode = resetLastClickedNode;
var updateFeatures = function () {
    return machine_setup_1.machine.assign(function (_a) {
        var context = _a.context, event = _a.event;
        (0, xstate_1.assertEvent)(event, 'update.features');
        return {
            features: __assign(__assign({}, context.features), event.features),
        };
    });
};
exports.updateFeatures = updateFeatures;
var updateInputs = function () {
    return machine_setup_1.machine.assign(function (_a) {
        var event = _a.event;
        (0, xstate_1.assertEvent)(event, 'update.inputs');
        return (0, core_1.exact)(__assign({}, event.inputs));
    });
};
exports.updateInputs = updateInputs;
var assignXYDataFromView = function (view) {
    return machine_setup_1.machine.assign(function (_a) {
        var context = _a.context, event = _a.event;
        var xydata;
        if (view) {
            xydata = (0, convert_to_xyflow_1.convertToXYFlow)({
                currentViewId: context.view.id,
                dynamicViewVariant: context.dynamicViewVariant,
                view: view,
                where: context.where,
            });
        }
        else {
            (0, xstate_1.assertEvent)(event, 'update.view');
            xydata = 'xynodes' in event ? event : (0, convert_to_xyflow_1.convertToXYFlow)({
                currentViewId: context.view.id,
                dynamicViewVariant: context.dynamicViewVariant,
                view: event.view,
                where: context.where,
            });
        }
        var update = (0, assign_1.mergeXYNodesEdges)(context, xydata);
        var lastClickedNode = context.lastClickedNode, focusedNode = context.focusedNode, activeWalkthrough = context.activeWalkthrough;
        if (lastClickedNode || focusedNode || activeWalkthrough) {
            var nodeIds = new Set(update.xynodes.map(function (n) { return n.id; }));
            if (lastClickedNode && !nodeIds.has(lastClickedNode.id)) {
                lastClickedNode = null;
            }
            if (focusedNode && !nodeIds.has(focusedNode)) {
                focusedNode = null;
            }
            var stepId_1 = activeWalkthrough === null || activeWalkthrough === void 0 ? void 0 : activeWalkthrough.stepId;
            if (stepId_1 && !update.xyedges.some(function (e) { return e.id === stepId_1; })) {
                activeWalkthrough = null;
            }
            return __assign(__assign({}, update), { lastClickedNode: lastClickedNode, focusedNode: focusedNode, activeWalkthrough: activeWalkthrough });
        }
        return update;
    });
};
exports.assignXYDataFromView = assignXYDataFromView;
var focusOnNodesAndEdges = function () {
    return machine_setup_1.machine.enqueueActions(function (_a) {
        var context = _a.context, enqueue = _a.enqueue;
        var next = (0, assign_1.focusNodesEdges)(context);
        if (next) {
            enqueue.assign(next);
        }
        else {
            // No focused node, cancel focus
            enqueue.raise({ type: 'key.esc' });
        }
    });
};
exports.focusOnNodesAndEdges = focusOnNodesAndEdges;
var undimEverything = function () {
    return machine_setup_1.machine.assign(function (_a) {
        var context = _a.context;
        return ({
            xynodes: context.xynodes.map(base_1.Base.setDimmed(false)),
            xyedges: context.xyedges.map(base_1.Base.setData({
                dimmed: false,
                active: false,
            })),
        });
    });
};
exports.undimEverything = undimEverything;
var assignDynamicViewVariant = function () {
    return machine_setup_1.machine.assign(function (_a) {
        var event = _a.event;
        (0, xstate_1.assertEvent)(event, 'switch.dynamicViewVariant');
        return {
            dynamicViewVariant: event.variant,
        };
    });
};
exports.assignDynamicViewVariant = assignDynamicViewVariant;
// Mouse event handlers with parameters
var onNodeMouseEnter = function (params) {
    return machine_setup_1.machine.assign(function (_a) {
        var context = _a.context, event = _a.event;
        var node = params === null || params === void 0 ? void 0 : params.node;
        if (!node) {
            (0, xstate_1.assertEvent)(event, 'xyflow.nodeMouseEnter');
            node = event.node;
        }
        return {
            xynodes: context.xynodes.map(function (n) {
                if (n.id === node.id) {
                    return base_1.Base.setHovered(n, true);
                }
                return n;
            }),
        };
    });
};
exports.onNodeMouseEnter = onNodeMouseEnter;
var onNodeMouseLeave = function (params) {
    return machine_setup_1.machine.assign(function (_a) {
        var context = _a.context, event = _a.event;
        var node = params === null || params === void 0 ? void 0 : params.node;
        if (!node) {
            (0, xstate_1.assertEvent)(event, 'xyflow.nodeMouseLeave');
            node = event.node;
        }
        return {
            xynodes: context.xynodes.map(function (n) {
                if (n.id === node.id) {
                    return base_1.Base.setHovered(n, false);
                }
                return n;
            }),
        };
    });
};
exports.onNodeMouseLeave = onNodeMouseLeave;
var emitPaneClick = function () {
    return machine_setup_1.machine.emit(function () { return ({
        type: 'paneClick',
    }); });
};
exports.emitPaneClick = emitPaneClick;
var emitOpenSource = function (params) {
    return machine_setup_1.machine.emit(function (_a) {
        var event = _a.event;
        if (params) {
            return ({
                type: 'openSource',
                params: params,
            });
        }
        (0, xstate_1.assertEvent)(event, 'open.source');
        return {
            type: 'openSource',
            params: event,
        };
    });
};
exports.emitOpenSource = emitOpenSource;
var emitOpenSourceOfView = function () {
    return machine_setup_1.machine.emit(function (_a) {
        var context = _a.context;
        return ({
            type: 'openSource',
            params: {
                view: context.view.id,
            },
        });
    });
};
exports.emitOpenSourceOfView = emitOpenSourceOfView;
var emitInitialized = function () {
    return machine_setup_1.machine.emit(function (_a) {
        var context = _a.context;
        (0, core_1.invariant)(context.xyflow, 'XYFlow instance not found');
        return {
            type: 'initialized',
            instance: context.xyflow,
        };
    });
};
exports.emitInitialized = emitInitialized;
var emitNodeClick = function () {
    return machine_setup_1.machine.emit(function (_a) {
        var context = _a.context, event = _a.event;
        (0, xstate_1.assertEvent)(event, 'xyflow.nodeClick');
        var node = (0, core_1.nonNullable)((0, utils_2.findDiagramNode)(context, event.node.id), "Node ".concat(event.node.id, " not found in diagram"));
        return {
            type: 'nodeClick',
            node: node,
            xynode: event.node,
        };
    });
};
exports.emitNodeClick = emitNodeClick;
var emitNavigateTo = function (params) {
    return machine_setup_1.machine.emit(function (_a) {
        var _b;
        var context = _a.context;
        return ({
            type: 'navigateTo',
            viewId: (_b = params === null || params === void 0 ? void 0 : params.viewId) !== null && _b !== void 0 ? _b : (0, core_1.nonNullable)(context.lastOnNavigate, 'Invalid state, lastOnNavigate is null').toView,
        });
    });
};
exports.emitNavigateTo = emitNavigateTo;
var emitEdgeClick = function () {
    return machine_setup_1.machine.emit(function (_a) {
        var context = _a.context, event = _a.event;
        (0, xstate_1.assertEvent)(event, 'xyflow.edgeClick');
        var edge = (0, core_1.nonNullable)((0, utils_2.findDiagramEdge)(context, event.edge.id), "Edge ".concat(event.edge.id, " not found in diagram"));
        return {
            type: 'edgeClick',
            edge: edge,
            xyedge: event.edge,
        };
    });
};
exports.emitEdgeClick = emitEdgeClick;
var triggerChange = function (viewChange) {
    return machine_setup_1.machine.enqueueActions(function (_a) {
        var event = _a.event, enqueue = _a.enqueue;
        var change = viewChange;
        if (!change) {
            (0, xstate_1.assertEvent)(event, 'trigger.change');
            change = event.change;
        }
        enqueue.assign({
            viewportChangedManually: true,
        });
        enqueue.sendTo(utils_2.typedSystem.editorActor, {
            type: 'change',
            change: change,
        });
    });
};
exports.triggerChange = triggerChange;
var emitOnLayoutTypeChange = function () {
    return machine_setup_1.machine.enqueueActions(function (_a) {
        var _b;
        var event = _a.event, system = _a.system, context = _a.context, enqueue = _a.enqueue;
        if (!context.features.enableCompareWithLatest) {
            console.warn('Layout type cannot be changed while CompareWithLatest feature is disabled');
            return;
        }
        var currentLayoutType = context.view._layout;
        // toggle
        var nextLayoutType = currentLayoutType === 'auto' ? 'manual' : 'auto';
        if (event.type === 'emit.onLayoutTypeChange') {
            nextLayoutType = event.layoutType;
        }
        if (currentLayoutType === nextLayoutType) {
            console.warn('Ignoring layout type change event, layout type is already', currentLayoutType);
            return;
        }
        if (context.toggledFeatures.enableCompareWithLatest === true) {
            // Check if we are switching from manual to auto layout while a sync is pending
            if (currentLayoutType === 'manual' && nextLayoutType === 'auto') {
                (_b = (0, utils_2.typedSystem)(system).editorActorRef) === null || _b === void 0 ? void 0 : _b.send({
                    type: 'cancel',
                });
            }
            var currentViewport = context.viewport;
            if (currentLayoutType === 'auto') {
                enqueue.assign({
                    viewportOnAutoLayout: currentViewport,
                });
            }
            if (currentLayoutType === 'manual') {
                enqueue.assign({
                    viewportOnManualLayout: currentViewport,
                });
            }
        }
        enqueue.emit({
            type: 'onLayoutTypeChange',
            layoutType: nextLayoutType,
        });
    });
};
exports.emitOnLayoutTypeChange = emitOnLayoutTypeChange;
var layoutAlign = function (params) {
    return machine_setup_1.machine.createAction(function (_a) {
        var context = _a.context, event = _a.event;
        var mode;
        if (params) {
            mode = params.mode;
        }
        else {
            (0, xstate_1.assertEvent)(event, 'layout.align');
            mode = event.mode;
        }
        var xystore = (0, core_1.nonNullable)(context.xystore, 'xystore is not initialized');
        var _b = xystore.getState(), nodeLookup = _b.nodeLookup, parentLookup = _b.parentLookup;
        var selectedNodes = new Set(nodeLookup.values().filter(function (n) { return n.selected; }).map(function (n) { return n.id; }));
        var nodesToAlign = __spreadArray([], (0, utils_1.difference)(selectedNodes, new Set(parentLookup.keys())), true);
        if (!(0, remeda_1.hasAtLeast)(nodesToAlign, 2)) {
            console.warn('At least 2 nodes must be selected to align');
            return;
        }
        var constraints = (0, useLayoutConstraints_1.createLayoutConstraints)(xystore, nodesToAlign);
        var aligner = (0, aligners_1.getAligner)(mode);
        var nodes = nodesToAlign.map(function (id) { return ({
            node: (0, core_1.nonNullable)(nodeLookup.get(id)),
            rect: (0, core_1.nonNullable)(constraints.rects.get(id)),
        }); });
        aligner.computeLayout(nodes.map(function (_a) {
            var node = _a.node;
            return (0, aligners_1.toNodeRect)(node);
        }));
        for (var _i = 0, nodes_1 = nodes; _i < nodes_1.length; _i++) {
            var _c = nodes_1[_i], rect = _c.rect, node = _c.node;
            rect.positionAbsolute = __assign(__assign({}, rect.positionAbsolute), aligner.applyPosition((0, aligners_1.toNodeRect)(node)));
        }
        constraints.updateXYFlow();
    });
};
exports.layoutAlign = layoutAlign;
var resetEdgesControlPoints = function () {
    return machine_setup_1.machine.assign(function (_a) {
        var context = _a.context;
        var nodeLookup = context.xystore.getState().nodeLookup;
        return {
            xyedges: context.xyedges.map(function (edge) {
                if (!edge.data.controlPoints) {
                    return edge;
                }
                var controlPoints = (0, assign_1.resetEdgeControlPoints)(nodeLookup, edge);
                var pt = controlPoints[0];
                return __assign(__assign({}, edge), { data: __assign(__assign({}, edge.data), { controlPoints: controlPoints, labelBBox: edge.data.labelBBox ? __assign(__assign({}, edge.data.labelBBox), { x: pt.x, y: pt.y }) : null, labelXY: edge.data.labelXY ? pt : null }) });
            }),
        };
    });
};
exports.resetEdgesControlPoints = resetEdgesControlPoints;
var notationsHighlight = function () {
    return machine_setup_1.machine.assign(function (_a) {
        var context = _a.context, event = _a.event;
        (0, xstate_1.assertEvent)(event, 'notations.highlight');
        var notation = event.notation, kind = event.kind;
        var targetKinds = kind ? [kind] : notation.kinds;
        var shouldHighlight = function (node) {
            return node.notation === notation.title &&
                node.shape === notation.shape &&
                node.color === notation.color &&
                targetKinds.includes(node.kind);
        };
        var xynodes = context.xynodes.map(function (n) {
            var node = (0, utils_2.findDiagramNode)(context, n.id);
            var highlighted = node && shouldHighlight(node);
            return base_1.Base.setDimmed(n, highlighted ? false : 'immediate');
        });
        var xyedges = context.xyedges.map(function (edge) {
            return base_1.Base.setDimmed(edge, true);
        });
        return { xynodes: xynodes, xyedges: xyedges };
    });
};
exports.notationsHighlight = notationsHighlight;
var tagHighlight = function () {
    return machine_setup_1.machine.assign(function (_a) {
        var context = _a.context, event = _a.event;
        (0, xstate_1.assertEvent)(event, 'tag.highlight');
        return {
            xynodes: context.xynodes.map(function (n) {
                var _a;
                if ((_a = n.data.tags) === null || _a === void 0 ? void 0 : _a.includes(event.tag)) {
                    return base_1.Base.setDimmed(n, false);
                }
                return base_1.Base.setDimmed(n, true);
            }),
        };
    });
};
exports.tagHighlight = tagHighlight;
var highlightNodeOrEdge = function () {
    return machine_setup_1.machine.assign(function (_a) {
        var context = _a.context, event = _a.event;
        (0, xstate_1.assertEvent)(event, ['highlight.edge', 'highlight.node']);
        switch (event.type) {
            case 'highlight.node': {
                var nodeId_1 = event.nodeId;
                var node = context.xynodes.find(function (n) { return n.id === nodeId_1; });
                if (!node) {
                    console.warn("Node with id ".concat(nodeId_1, " not found for highlighting"));
                    return {};
                }
                return {
                    xynodes: context.xynodes.map(function (n) {
                        return base_1.Base.setDimmed(n, n.id === nodeId_1 ? false : true);
                    }),
                    xyedges: context.xyedges.map(base_1.Base.setData({
                        dimmed: true,
                        active: false,
                    })),
                };
            }
            case 'highlight.edge': {
                var edgeId_1 = event.edgeId;
                var edge_1 = context.xyedges.find(function (e) { return e.id === edgeId_1; });
                if (!edge_1) {
                    console.warn("Edge with id ".concat(edgeId_1, " not found for highlighting"));
                    return {};
                }
                return {
                    xynodes: context.xynodes.map(function (n) {
                        return base_1.Base.setDimmed(n, edge_1.source !== n.id && edge_1.target !== n.id);
                    }),
                    xyedges: context.xyedges.map(function (e) {
                        return base_1.Base.setData(e, {
                            dimmed: e.id !== edgeId_1,
                            active: e.id === edgeId_1,
                        });
                    }),
                };
            }
            default:
                (0, core_1.nonexhaustive)(event);
        }
    });
};
exports.highlightNodeOrEdge = highlightNodeOrEdge;
var assignToggledFeatures = function () {
    return machine_setup_1.machine.assign(function (_a) {
        var _b;
        var _c, _d;
        var context = _a.context, event = _a.event;
        (0, xstate_1.assertEvent)(event, 'toggle.feature');
        var feature = "enable".concat(event.feature);
        var currentValue = (_c = context.toggledFeatures[feature]) !== null && _c !== void 0 ? _c : context.features[feature];
        var nextValue = (_d = event.forceValue) !== null && _d !== void 0 ? _d : !currentValue;
        return {
            toggledFeatures: __assign(__assign({}, context.toggledFeatures), (_b = {}, _b[feature] = nextValue, _b)),
        };
    });
};
exports.assignToggledFeatures = assignToggledFeatures;
// SendTo actions that don't depend on others
var closeSearch = function () {
    return machine_setup_1.machine.sendTo(utils_2.typedSystem.searchActor, {
        type: 'close',
    });
};
exports.closeSearch = closeSearch;
var closeAllOverlays = function () {
    return machine_setup_1.machine.sendTo(utils_2.typedSystem.overlaysActor, {
        type: 'close.all',
    });
};
exports.closeAllOverlays = closeAllOverlays;
var stopEditorActor = function () {
    return machine_setup_1.machine.enqueueActions(function (_a) {
        var enqueue = _a.enqueue, system = _a.system;
        var actor = (0, utils_2.typedSystem)(system).editorActorRef;
        if (!actor)
            return;
        enqueue.stopChild(actor);
    });
};
exports.stopEditorActor = stopEditorActor;
/**
 * Ensure that the sync layout actor is running or stopped based on the read-only state
 */
var ensureEditorActor = function () {
    return machine_setup_1.machine.enqueueActions(function (_a) {
        var enqueue = _a.enqueue, context = _a.context, system = _a.system, check = _a.check;
        var hasEditor = check('enabled: Editor');
        var editor = (0, utils_2.typedSystem)(system).editorActorRef;
        // Check if the context is read-only
        if (!hasEditor && editor) {
            enqueue.stopChild(editor);
            return;
        }
        if (hasEditor && !editor) {
            enqueue.spawnChild('editorActor', {
                id: 'editor',
                systemId: 'editor',
                input: {
                    viewId: context.view.id,
                },
                syncSnapshot: true,
            });
        }
    });
};
exports.ensureEditorActor = ensureEditorActor;
var startEditing = function (subject) {
    if (subject === void 0) { subject = 'node'; }
    return machine_setup_1.machine.sendTo(utils_2.typedSystem.editorActor, {
        type: 'edit.start',
        subject: subject,
    });
};
exports.startEditing = startEditing;
var sendSynced = function () {
    return machine_setup_1.machine.sendTo(utils_2.typedSystem.editorActor, {
        type: 'synced',
    });
};
exports.sendSynced = sendSynced;
var stopEditing = function (wasChanged) {
    if (wasChanged === void 0) { wasChanged = false; }
    return machine_setup_1.machine.sendTo(utils_2.typedSystem.editorActor, {
        type: 'edit.finish',
        wasChanged: wasChanged,
    });
};
exports.stopEditing = stopEditing;
var cancelEditing = function () {
    return machine_setup_1.machine.sendTo(utils_2.typedSystem.editorActor, {
        type: 'cancel',
    });
};
exports.cancelEditing = cancelEditing;
var hasModelFqn = function (node) {
    return 'modelFqn' in node.data && (0, remeda_1.isTruthy)(node.data.modelFqn);
};
var openElementDetails = function (params) {
    return machine_setup_1.machine.enqueueActions(function (_a) {
        var _b, _c;
        var context = _a.context, event = _a.event, enqueue = _a.enqueue;
        var initiatedFrom = null;
        var fromNodeId, subject;
        switch (true) {
            // Use from params if available
            case !!params: {
                subject = params.fqn;
                fromNodeId = (_b = params.fromNode) !== null && _b !== void 0 ? _b : (_c = context.view.nodes.find(function (n) { return n.modelRef === params.fqn; })) === null || _c === void 0 ? void 0 : _c.id;
                break;
            }
            case event.type === 'xyflow.nodeClick': {
                if (!hasModelFqn(event.node)) {
                    console.warn('No modelFqn in clicked node data');
                    return;
                }
                subject = event.node.data.modelFqn;
                fromNodeId = event.node.data.id;
                break;
            }
            case event.type === 'open.elementDetails': {
                subject = event.fqn;
                fromNodeId = event.fromNode;
                break;
            }
            default: {
                if (!context.lastClickedNode) {
                    console.warn('No last clicked node');
                    return;
                }
                fromNodeId = context.lastClickedNode.id;
                var node = context.xynodes.find(function (n) { return n.id === fromNodeId; });
                if (!node || !hasModelFqn(node)) {
                    console.warn('No modelFqn in last clicked node');
                    return;
                }
                subject = node.data.modelFqn;
                break;
            }
        }
        var internalNode = fromNodeId ? context.xystore.getState().nodeLookup.get(fromNodeId) : null;
        if (fromNodeId && internalNode) {
            var nodeRect = (0, system_1.nodeToRect)(internalNode);
            var zoom = context.xyflow.getZoom();
            var clientRect = __assign(__assign({}, context.xyflow.flowToScreenPosition(nodeRect)), { width: nodeRect.width * zoom, height: nodeRect.height * zoom });
            initiatedFrom = {
                node: fromNodeId,
                clientRect: clientRect,
            };
        }
        enqueue.sendTo(utils_2.typedSystem.overlaysActor, __assign({ type: 'open.elementDetails', subject: subject, currentView: context.view }, (initiatedFrom && { initiatedFrom: initiatedFrom })));
    });
};
exports.openElementDetails = openElementDetails;
var openOverlay = function () {
    return machine_setup_1.machine.enqueueActions(function (_a) {
        var context = _a.context, event = _a.event, enqueue = _a.enqueue, check = _a.check;
        (0, xstate_1.assertEvent)(event, ['open.relationshipsBrowser', 'open.relationshipDetails', 'open.elementDetails']);
        if (!check('enabled: Overlays')) {
            console.warn('Overlays feature is disabled');
            return;
        }
        switch (event.type) {
            case 'open.elementDetails': {
                check('enabled: ElementDetails')
                    ? enqueue((0, exports.openElementDetails)())
                    : console.warn('ElementDetails feature is disabled');
                break;
            }
            case 'open.relationshipsBrowser': {
                if (!context.features.enableRelationshipBrowser) {
                    console.warn('RelationshipBrowser feature is disabled');
                    return;
                }
                enqueue.sendTo(utils_2.typedSystem.overlaysActor, {
                    type: 'open.relationshipsBrowser',
                    subject: event.fqn,
                    viewId: context.view.id,
                    scope: 'view',
                    closeable: true,
                    enableChangeScope: true,
                    enableSelectSubject: true,
                });
                break;
            }
            case 'open.relationshipDetails': {
                if (!context.features.enableRelationshipDetails) {
                    console.warn('RelationshipDetails feature is disabled');
                    return;
                }
                enqueue.sendTo(utils_2.typedSystem.overlaysActor, __assign({ type: 'open.relationshipDetails', viewId: context.view.id }, event.params));
                break;
            }
            default:
                (0, core_1.nonexhaustive)(event);
        }
    });
};
exports.openOverlay = openOverlay;
var openSourceOfFocusedOrLastClickedNode = function () {
    return machine_setup_1.machine.enqueueActions(function (_a) {
        var _b, _c;
        var context = _a.context, enqueue = _a.enqueue;
        var nodeId = (_b = context.focusedNode) !== null && _b !== void 0 ? _b : (_c = context.lastClickedNode) === null || _c === void 0 ? void 0 : _c.id;
        if (!nodeId || !context.features.enableVscode)
            return;
        var diagramNode = (0, utils_2.findDiagramNode)(context, nodeId);
        if (!diagramNode)
            return;
        if (diagramNode.deploymentRef) {
            enqueue.raise({ type: 'open.source', deployment: diagramNode.deploymentRef });
        }
        else if (diagramNode.modelRef) {
            enqueue.raise({ type: 'open.source', element: diagramNode.modelRef });
        }
    });
};
exports.openSourceOfFocusedOrLastClickedNode = openSourceOfFocusedOrLastClickedNode;
/**
 * Ensure that the overlays actor is running or stopped based on the current feature flags
 */
var ensureOverlaysActor = function () {
    return machine_setup_1.machine.enqueueActions(function (_a) {
        var enqueue = _a.enqueue, check = _a.check, system = _a.system;
        var enabled = check('enabled: Overlays');
        var running = (0, utils_2.typedSystem)(system).overlaysActorRef;
        if (enabled && !running) {
            enqueue.spawnChild('overlaysActorLogic', {
                id: 'overlays',
                systemId: 'overlays',
                syncSnapshot: true,
            });
            return;
        }
        if (!enabled && running) {
            enqueue.sendTo(running, {
                type: 'close.all',
            });
            enqueue.stopChild(running);
        }
    });
};
exports.ensureOverlaysActor = ensureOverlaysActor;
/**
 * Ensure that the search actor is running or stopped based on the current feature flags
 */
var ensureSearchActor = function () {
    return machine_setup_1.machine.enqueueActions(function (_a) {
        var enqueue = _a.enqueue, check = _a.check, system = _a.system;
        var enabled = check('enabled: Search');
        var running = (0, utils_2.typedSystem)(system).searchActorRef;
        if (enabled && !running) {
            enqueue.spawnChild('searchActorLogic', {
                id: 'search',
                systemId: 'search',
                syncSnapshot: true,
            });
            return;
        }
        if (!enabled && running) {
            enqueue.sendTo(running, {
                type: 'close',
            });
            enqueue.stopChild(running);
        }
    });
};
exports.ensureSearchActor = ensureSearchActor;
var onEdgeMouseEnter = function () {
    return machine_setup_1.machine.enqueueActions(function (_a) {
        var enqueue = _a.enqueue, context = _a.context, event = _a.event;
        (0, xstate_1.assertEvent)(event, 'xyflow.edgeMouseEnter');
        var edge = event.edge;
        enqueue.assign({
            xyedges: context.xyedges.map(function (e) {
                if (e.id === event.edge.id) {
                    // Set hovered state (will be used in emitted event)
                    edge = base_1.Base.setHovered(e, true);
                    return edge;
                }
                return e;
            }),
        });
        enqueue.emit({
            type: 'edgeMouseEnter',
            edge: edge,
            event: event.event,
        });
    });
};
exports.onEdgeMouseEnter = onEdgeMouseEnter;
var onEdgeMouseLeave = function () {
    return machine_setup_1.machine.enqueueActions(function (_a) {
        var enqueue = _a.enqueue, context = _a.context, event = _a.event;
        (0, xstate_1.assertEvent)(event, 'xyflow.edgeMouseLeave');
        var edge = event.edge;
        enqueue.assign({
            xyedges: context.xyedges.map(function (e) {
                if (e.id === event.edge.id) {
                    edge = base_1.Base.setHovered(e, false);
                    return edge;
                }
                return e;
            }),
        });
        enqueue.emit({
            type: 'edgeMouseLeave',
            edge: edge,
            event: event.event,
        });
    });
};
exports.onEdgeMouseLeave = onEdgeMouseLeave;
var reraise = function () { return machine_setup_1.machine.raise(function (_a) {
    var event = _a.event;
    return event;
}, { delay: 50 }); };
exports.reraise = reraise;
var startHotKeyActor = function () { return machine_setup_1.machine.spawnChild('hotkeyActorLogic', { id: 'hotkey' }); };
exports.startHotKeyActor = startHotKeyActor;
var stopHotKeyActor = function () { return machine_setup_1.machine.stopChild('hotkey'); };
exports.stopHotKeyActor = stopHotKeyActor;
/**
 * Auto-unfocus timer duration in milliseconds.
 * Set to 0 to disable auto-unfocus (focus remains until user clicks elsewhere).
 * Used for focusing nodes from search results.
 */
var AUTO_UNFOCUS_DELAY = 3000;
var startAutoUnfocusTimer = function () {
    return machine_setup_1.machine.enqueueActions(function (_a) {
        var context = _a.context, enqueue = _a.enqueue;
        if (context.autoUnfocusTimer && AUTO_UNFOCUS_DELAY > 0) {
            enqueue.raise({ type: 'focus.autoUnfocus' }, { delay: AUTO_UNFOCUS_DELAY, id: 'autoUnfocusTimer' });
        }
    });
};
exports.startAutoUnfocusTimer = startAutoUnfocusTimer;
var cancelAutoUnfocusTimer = function () { return machine_setup_1.machine.cancel('autoUnfocusTimer'); };
exports.cancelAutoUnfocusTimer = cancelAutoUnfocusTimer;
var handleNavigate = function () {
    return machine_setup_1.machine.enqueueActions(function (_a) {
        var _b, _c, _d;
        var enqueue = _a.enqueue, context = _a.context, event = _a.event;
        (0, xstate_1.assertEvent)(event, ['navigate.to', 'navigate.back', 'navigate.forward']);
        var view = context.view, focusedNode = context.focusedNode, activeWalkthrough = context.activeWalkthrough, dynamicViewVariant = context.dynamicViewVariant, viewport = context.viewport, viewportChangedManually = context.viewportChangedManually, viewportBefore = context.viewportBefore, navigationHistory = context.navigationHistory;
        var currentIndex = navigationHistory.currentIndex, _history = navigationHistory.history;
        var history = _history;
        if (currentIndex < _history.length) {
            var updatedEntry = (0, immer_1.produce)((_b = _history.at(currentIndex)) !== null && _b !== void 0 ? _b : {}, function (draft) {
                var _a;
                draft.viewport = __assign({}, viewport);
                draft.viewportChangedManually = viewportChangedManually;
                draft.focusedNode = focusedNode;
                if (view._type === 'dynamic') {
                    draft.activeWalkthrough = (_a = activeWalkthrough === null || activeWalkthrough === void 0 ? void 0 : activeWalkthrough.stepId) !== null && _a !== void 0 ? _a : null;
                    draft.dynamicViewVariant = dynamicViewVariant;
                }
                else {
                    draft.activeWalkthrough = null;
                    draft.dynamicViewVariant = null;
                }
                if (viewportBefore) {
                    draft.viewportBefore = structuredClone(viewportBefore);
                }
                else {
                    delete draft.viewportBefore;
                }
            });
            history = __spreadArray([], _history, true);
            history[currentIndex] = updatedEntry;
        }
        switch (event.type) {
            case 'navigate.to': {
                enqueue.assign({
                    navigationHistory: {
                        currentIndex: currentIndex,
                        history: history,
                    },
                    lastOnNavigate: {
                        fromView: context.view.id,
                        toView: event.viewId,
                        fromNode: (_c = event.fromNode) !== null && _c !== void 0 ? _c : null,
                        focusOnElement: (_d = event.focusOnElement) !== null && _d !== void 0 ? _d : null,
                    },
                });
                enqueue((0, exports.emitNavigateTo)());
                break;
            }
            case 'navigate.back': {
                (0, core_1.invariant)(currentIndex > 0, 'Cannot navigate back');
                var stepBack = history[currentIndex - 1];
                enqueue.assign({
                    navigationHistory: {
                        currentIndex: currentIndex - 1,
                        history: history,
                    },
                    lastOnNavigate: null,
                });
                enqueue((0, exports.emitNavigateTo)({ viewId: stepBack.viewId }));
                break;
            }
            case 'navigate.forward': {
                (0, core_1.invariant)(currentIndex < history.length - 1, 'Cannot navigate forward');
                var stepForward = history[currentIndex + 1];
                enqueue.assign({
                    navigationHistory: {
                        currentIndex: currentIndex + 1,
                        history: history,
                    },
                    lastOnNavigate: null,
                });
                enqueue((0, exports.emitNavigateTo)({ viewId: stepForward.viewId }));
                break;
            }
            default:
                (0, core_1.nonexhaustive)(event);
        }
    });
};
exports.handleNavigate = handleNavigate;
var updateView = function () {
    return machine_setup_1.machine.enqueueActions(function (_a) {
        var enqueue = _a.enqueue, event = _a.event, context = _a.context;
        if (event.type !== 'update.view') {
            console.warn("Ignoring unexpected event type: ".concat(event.type, " in action 'update.view'"));
            return;
        }
        var nextView = event.view;
        var isAnotherView = nextView.id !== context.view.id;
        if (isAnotherView) {
            console.warn('updateView called for another view - ignoring', { event: event });
            return;
        }
        enqueue((0, exports.assignXYDataFromView)());
        if (event.source === 'editor') {
            return;
        }
        enqueue((0, exports.sendSynced)());
        if (context.toggledFeatures.enableCompareWithLatest === true && context.view._layout !== nextView._layout) {
            if (nextView._layout === 'auto' && context.viewportOnAutoLayout) {
                enqueue((0, machine_actions_layout_1.setViewport)({
                    viewport: context.viewportOnAutoLayout,
                    duration: 0,
                }));
                return;
            }
            // If switching to manual layout, restore previous manual layout viewport
            if (nextView._layout === 'manual' && context.viewportOnManualLayout) {
                enqueue((0, machine_actions_layout_1.setViewport)({
                    viewport: context.viewportOnManualLayout,
                    duration: 0,
                }));
                return;
            }
        }
        var recenter = !context.viewportChangedManually && !context.focusedNode && !context.activeWalkthrough;
        // Check if comparing layouts is enabled and layout changed
        recenter = recenter || (context.toggledFeatures.enableCompareWithLatest === true &&
            !!nextView._layout &&
            context.view._layout !== nextView._layout);
        if (nextView._type === 'dynamic' && context.view._type === 'dynamic') {
            // If the dynamic view variant changed, recenter
            if (nextView.variant === context.view.variant && nextView.variant !== context.dynamicViewVariant) {
                var nextCenter = geometry_1.BBox.center((0, utils_2.viewBounds)(context, nextView));
                enqueue((0, machine_actions_layout_1.setViewportCenter)(nextCenter));
            }
        }
        if (recenter) {
            // Recenter the diagram to fit all elements
            enqueue((0, machine_actions_layout_1.cancelFitDiagram)());
            enqueue((0, machine_actions_layout_1.raiseFitDiagram)());
        }
    });
};
exports.updateView = updateView;
