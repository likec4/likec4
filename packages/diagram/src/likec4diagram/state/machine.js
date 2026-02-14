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
exports.diagramMachine = void 0;
var react_1 = require("@xyflow/react");
var actions_1 = require("xstate/actions");
var DiagramFeatures_1 = require("../../context/DiagramFeatures");
var assign_1 = require("./assign");
var machine_actions_1 = require("./machine.actions");
var machine_setup_1 = require("./machine.setup");
var machine_state_initializing_1 = require("./machine.state.initializing");
var machine_state_navigating_1 = require("./machine.state.navigating");
var machine_state_ready_1 = require("./machine.state.ready");
var persistence_1 = require("./persistence");
var _diagramMachine = machine_setup_1.machine.createMachine({
    initial: 'initializing',
    context: function (_a) {
        var _b, _c, _d;
        var input = _a.input;
        return (__assign(__assign({}, input), { xyedges: [], xynodes: [], features: __assign(__assign({}, DiagramFeatures_1.DefaultFeatures), input.features), toggledFeatures: (_b = persistence_1.DiagramToggledFeaturesPersistence.read()) !== null && _b !== void 0 ? _b : {
                enableReadOnly: true,
                enableCompareWithLatest: false,
            }, initialized: {
                xydata: false,
                xyflow: false,
            }, viewportChangedManually: false, lastOnNavigate: null, lastClickedNode: null, focusedNode: null, autoUnfocusTimer: false, activeElementDetails: null, viewportBefore: null, viewportOnManualLayout: null, viewportOnAutoLayout: null, navigationHistory: {
                currentIndex: 0,
                history: [],
            }, viewport: { x: 0, y: 0, zoom: 1 }, xyflow: null, dynamicViewVariant: (_d = (_c = input.dynamicViewVariant) !== null && _c !== void 0 ? _c : (input.view._type === 'dynamic' ? input.view.variant : 'diagram')) !== null && _d !== void 0 ? _d : 'diagram', activeWalkthrough: null }));
    },
    states: {
        initializing: machine_state_initializing_1.initializing,
        isReady: machine_state_initializing_1.isReady,
        ready: machine_state_ready_1.ready,
        navigating: machine_state_navigating_1.navigating,
        final: {
            type: 'final',
        },
    },
    on: {
        'update.nodeData': {
            actions: (0, actions_1.assign)(assign_1.updateNodeData),
        },
        'update.edgeData': {
            actions: (0, actions_1.assign)(assign_1.updateEdgeData),
        },
        'switch.dynamicViewVariant': {
            guard: function (_a) {
                var context = _a.context, event = _a.event;
                return context.dynamicViewVariant !== event.variant;
            },
            actions: [
                (0, machine_actions_1.assignDynamicViewVariant)(),
                (0, actions_1.assign)({
                    viewportChangedManually: false,
                }),
                (0, machine_actions_1.raiseUpdateView)(),
            ],
        },
        'update.inputs': {
            actions: (0, machine_actions_1.updateInputs)(),
        },
        'update.view-bounds': {
            actions: (0, actions_1.assign)(function (_a) {
                var context = _a.context, event = _a.event;
                return {
                    view: __assign(__assign({}, context.view), { bounds: event.bounds }),
                };
            }),
        },
        'update.features': {
            actions: (0, machine_actions_1.updateFeatures)(),
        },
        'trigger.change': {
            actions: (0, machine_actions_1.triggerChange)(),
        },
        'emit.onLayoutTypeChange': {
            actions: (0, machine_actions_1.emitOnLayoutTypeChange)(),
        },
        'xyflow.applyChanges': {
            actions: (0, actions_1.assign)(function (_a) {
                var context = _a.context, event = _a.event;
                return {
                    xynodes: event.nodes ? (0, react_1.applyNodeChanges)(event.nodes, context.xynodes) : context.xynodes,
                    xyedges: event.edges ? (0, react_1.applyEdgeChanges)(event.edges, context.xyedges) : context.xyedges,
                };
            }),
        },
        'xyflow.viewportMoved': {
            actions: (0, actions_1.assign)(function (_a) {
                var event = _a.event, context = _a.context;
                return ({
                    viewportChangedManually: context.viewportChangedManually || event.manually,
                    viewport: event.viewport,
                });
            }),
        },
        'destroy': {
            target: '.final',
            actions: [
                (0, machine_actions_1.stopEditorActor)(),
                (0, machine_actions_1.cancelFitDiagram)(),
                (0, actions_1.stopChild)('hotkey'),
                (0, actions_1.stopChild)('overlays'),
                (0, actions_1.stopChild)('search'),
                (0, actions_1.stopChild)('mediaPrint'),
                (0, actions_1.assign)({
                    xyflow: null,
                    xystore: null,
                    xyedges: [],
                    xynodes: [],
                    initialized: {
                        xydata: false,
                        xyflow: false,
                    },
                }),
            ],
        },
    },
});
exports.diagramMachine = _diagramMachine;
