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
exports.ready = void 0;
var actions_1 = require("xstate/actions");
var guards_1 = require("xstate/guards");
var machine_actions_1 = require("./machine.actions");
var machine_setup_1 = require("./machine.setup");
var machine_state_ready_focused_1 = require("./machine.state.ready.focused");
var machine_state_ready_idle_1 = require("./machine.state.ready.idle");
var machine_state_ready_printing_1 = require("./machine.state.ready.printing");
var machine_state_ready_walkthrough_1 = require("./machine.state.ready.walkthrough");
var utils_1 = require("./utils");
// Main ready state with all its substates and transitions
exports.ready = machine_setup_1.machine.createStateConfig({
    initial: 'idle',
    entry: [
        (0, actions_1.spawnChild)('mediaPrintActorLogic', { id: 'mediaPrint' }),
        (0, machine_actions_1.ensureEditorActor)(),
        (0, machine_actions_1.ensureOverlaysActor)(),
        (0, machine_actions_1.ensureSearchActor)(),
    ],
    exit: [
        (0, machine_actions_1.cancelFitDiagram)(),
        (0, actions_1.stopChild)('mediaPrint'),
        (0, machine_actions_1.closeAllOverlays)(),
        (0, machine_actions_1.closeSearch)(),
        (0, machine_actions_1.stopEditorActor)(),
    ],
    states: {
        idle: machine_state_ready_idle_1.idle,
        focused: machine_state_ready_focused_1.focused,
        walkthrough: machine_state_ready_walkthrough_1.walkthrough,
        printing: machine_state_ready_printing_1.printing,
    },
    on: {
        'layout.align': {
            guard: 'not readonly',
            actions: [
                (0, machine_actions_1.startEditing)('node'),
                (0, machine_actions_1.layoutAlign)(),
                (0, machine_actions_1.stopEditing)(true),
            ],
        },
        'layout.resetEdgeControlPoints': {
            guard: 'not readonly',
            actions: [
                (0, machine_actions_1.startEditing)('edge'),
                (0, machine_actions_1.resetEdgesControlPoints)(),
                (0, machine_actions_1.stopEditing)(true),
            ],
        },
        'layout.resetManualLayout': {
            actions: [
                (0, machine_actions_1.cancelEditing)(),
                (0, machine_actions_1.disableCompareWithLatest)(),
                (0, machine_actions_1.triggerChange)({
                    op: 'reset-manual-layout',
                }),
            ],
        },
        'media.print.on': __assign({}, machine_setup_1.to.printing),
        'navigate.*': {
            actions: (0, machine_actions_1.handleNavigate)(),
        },
        'notations.highlight': {
            actions: (0, machine_actions_1.notationsHighlight)(),
        },
        'notations.unhighlight': {
            actions: (0, machine_actions_1.undimEverything)(),
        },
        'highlight.*': {
            actions: (0, machine_actions_1.highlightNodeOrEdge)(),
        },
        'unhighlight.all': {
            actions: (0, machine_actions_1.undimEverything)(),
        },
        'open.elementDetails': {
            actions: (0, machine_actions_1.openOverlay)(),
        },
        'open.relationshipDetails': {
            actions: (0, machine_actions_1.openOverlay)(),
        },
        'open.relationshipsBrowser': {
            actions: (0, machine_actions_1.openOverlay)(),
        },
        'open.search': {
            guard: 'enabled: Search',
            actions: (0, actions_1.sendTo)(utils_1.typedSystem.searchActor, function (_a) {
                var event = _a.event;
                return ({
                    type: 'open',
                    search: event.search,
                });
            }),
        },
        'open.source': {
            guard: 'enabled: OpenSource',
            actions: (0, machine_actions_1.emitOpenSource)(),
        },
        'tag.highlight': {
            actions: (0, machine_actions_1.tagHighlight)(),
        },
        'tag.unhighlight': {
            actions: (0, machine_actions_1.undimEverything)(),
        },
        'toggle.feature': {
            actions: (0, machine_actions_1.assignToggledFeatures)(),
        },
        'update.features': {
            actions: [
                (0, machine_actions_1.updateFeatures)(),
                (0, machine_actions_1.ensureOverlaysActor)(),
                (0, machine_actions_1.ensureSearchActor)(),
                (0, machine_actions_1.ensureEditorActor)(),
            ],
        },
        'update.view': [
            __assign({ guard: 'is another view' }, machine_setup_1.to.navigating),
            // Otherwise, just update the view in place
            {
                actions: (0, machine_actions_1.updateView)(),
            },
        ],
        'walkthrough.start': __assign({ guard: 'is dynamic view' }, machine_setup_1.to.walkthrough),
        'xyflow.edgeClick': {
            actions: [
                (0, machine_actions_1.resetLastClickedNode)(),
                (0, machine_actions_1.emitEdgeClick)(),
            ],
        },
        'xyflow.edgeDoubleClick': {
            guard: (0, guards_1.and)([
                'not readonly',
                function (_a) {
                    var event = _a.event;
                    return !!event.edge.data.controlPoints && event.edge.data.controlPoints.length > 0;
                },
            ]),
            actions: [
                (0, machine_actions_1.startEditing)('edge'),
                (0, machine_actions_1.onEdgeDoubleClick)(),
                (0, machine_actions_1.stopEditing)(true),
            ],
        },
        'xyflow.edgeMouseEnter': {
            actions: (0, machine_actions_1.onEdgeMouseEnter)(),
        },
        'xyflow.edgeMouseLeave': {
            actions: (0, machine_actions_1.onEdgeMouseLeave)(),
        },
        'xyflow.centerViewport': {
            actions: (0, machine_actions_1.centerOnNodeOrEdge)(),
        },
        'xyflow.fitDiagram': {
            guard: 'enabled: FitView',
            actions: [
                (0, actions_1.assign)({
                    viewportChangedManually: false,
                }),
                (0, machine_actions_1.fitDiagram)(),
            ],
        },
        'xyflow.nodeClick': {
            actions: [
                (0, machine_actions_1.assignLastClickedNode)(),
                (0, machine_actions_1.emitNodeClick)(),
            ],
        },
        'xyflow.nodeMouseEnter': {
            actions: (0, machine_actions_1.onNodeMouseEnter)(),
        },
        'xyflow.nodeMouseLeave': {
            actions: (0, machine_actions_1.onNodeMouseLeave)(),
        },
        'xyflow.paneClick': {
            actions: [
                (0, machine_actions_1.resetLastClickedNode)(),
                (0, machine_actions_1.emitPaneClick)(),
            ],
        },
        'xyflow.paneDblClick': {
            actions: [
                (0, machine_actions_1.resetLastClickedNode)(),
                (0, machine_actions_1.cancelFitDiagram)(),
                (0, machine_actions_1.raiseFitDiagram)(),
                (0, machine_actions_1.emitOpenSourceOfView)(),
                (0, machine_actions_1.emitPaneClick)(),
            ],
        },
        'xyflow.resized': {
            guard: function (_a) {
                var context = _a.context;
                return context.features.enableFitView && !context.viewportChangedManually;
            },
            actions: [
                (0, machine_actions_1.cancelFitDiagram)(),
                (0, machine_actions_1.raiseFitDiagram)({ delay: 150 }),
            ],
        },
        'xyflow.setViewport': {
            actions: (0, machine_actions_1.setViewport)(),
        },
    },
});
