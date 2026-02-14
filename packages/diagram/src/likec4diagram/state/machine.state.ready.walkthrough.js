"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.walkthrough = void 0;
var core_1 = require("@likec4/core");
var remeda_1 = require("remeda");
var xstate_1 = require("xstate");
var actions_1 = require("xstate/actions");
var base_1 = require("../../base");
var const_1 = require("../xyflow-sequence/const");
var machine_actions_1 = require("./machine.actions");
var machine_setup_1 = require("./machine.setup");
var updateActiveWalkthroughState = function () {
    return machine_setup_1.machine.enqueueActions(function (_a) {
        var context = _a.context, enqueue = _a.enqueue;
        var activeWalkthrough = context.activeWalkthrough;
        if (!activeWalkthrough) {
            console.warn('Active walkthrough is null');
            enqueue.raise({ type: 'walkthrough.end' });
            return;
        }
        var stepId = activeWalkthrough.stepId, parallelPrefix = activeWalkthrough.parallelPrefix;
        var step = context.xyedges.find(function (x) { return x.id === stepId; });
        if (!step) {
            console.warn('Invalid walkthrough stepId:', stepId);
            enqueue.raise({ type: 'walkthrough.end' });
            return;
        }
        enqueue.assign({
            xyedges: context.xyedges.map(function (edge) {
                var active = stepId === edge.id || (!!parallelPrefix && edge.id.startsWith(parallelPrefix));
                return base_1.Base.setData(edge, {
                    active: active,
                    dimmed: stepId !== edge.id,
                });
            }),
            xynodes: context.xynodes.map(function (node) {
                var dimmed = step.source !== node.id && step.target !== node.id;
                if (node.type === 'seq-parallel') {
                    return base_1.Base.setData(node, {
                        color: parallelPrefix === node.data.parallelPrefix
                            ? const_1.SeqParallelAreaColor.active
                            : const_1.SeqParallelAreaColor.default,
                        dimmed: dimmed,
                    });
                }
                return base_1.Base.setDimmed(node, dimmed);
            }),
        });
    });
};
var emitWalkthroughStarted = function () {
    return machine_setup_1.machine.emit(function (_a) {
        var context = _a.context;
        var edge = context.xyedges.find(function (x) { var _a; return x.id === ((_a = context.activeWalkthrough) === null || _a === void 0 ? void 0 : _a.stepId); });
        (0, core_1.invariant)(edge, 'Invalid walkthrough state');
        return {
            type: 'walkthroughStarted',
            edge: edge,
        };
    });
};
// Emit actions that don't depend on other actions
var emitWalkthroughStopped = function () {
    return machine_setup_1.machine.emit(function () { return ({
        type: 'walkthroughStopped',
    }); });
};
var emitWalkthroughStep = function () {
    return machine_setup_1.machine.emit(function (_a) {
        var context = _a.context;
        var edge = context.xyedges.find(function (x) { var _a; return x.id === ((_a = context.activeWalkthrough) === null || _a === void 0 ? void 0 : _a.stepId); });
        (0, core_1.invariant)(edge, 'Invalid walkthrough state');
        return {
            type: 'walkthroughStep',
            edge: edge,
        };
    });
};
exports.walkthrough = machine_setup_1.machine.createStateConfig({
    id: machine_setup_1.targetState.walkthrough.slice(1),
    entry: [
        (0, machine_actions_1.startHotKeyActor)(),
        (0, machine_actions_1.cancelEditing)(),
        (0, machine_actions_1.cancelFitDiagram)(),
        (0, machine_actions_1.assignViewportBefore)(),
        (0, actions_1.assign)({
            activeWalkthrough: function (_a) {
                var _b;
                var context = _a.context, event = _a.event;
                (0, xstate_1.assertEvent)(event, 'walkthrough.start');
                var stepId = (_b = event.stepId) !== null && _b !== void 0 ? _b : (0, remeda_1.first)(context.xyedges).id;
                return {
                    stepId: stepId,
                    parallelPrefix: (0, core_1.getParallelStepsPrefix)(stepId),
                };
            },
        }),
        updateActiveWalkthroughState(),
        (0, machine_actions_1.fitFocusedBounds)(),
        emitWalkthroughStarted(),
    ],
    exit: [
        (0, machine_actions_1.stopHotKeyActor)(),
        (0, actions_1.enqueueActions)(function (_a) {
            var _b;
            var enqueue = _a.enqueue, context = _a.context;
            enqueue.assign({
                activeWalkthrough: null,
            });
            // Disable parallel areas highlight
            if (context.dynamicViewVariant === 'sequence' && ((_b = context.activeWalkthrough) === null || _b === void 0 ? void 0 : _b.parallelPrefix)) {
                enqueue.assign({
                    xynodes: context.xynodes.map(function (n) {
                        if (n.type === 'seq-parallel') {
                            return base_1.Base.setData(n, {
                                color: const_1.SeqParallelAreaColor.default,
                            });
                        }
                        return n;
                    }),
                });
            }
        }),
        (0, machine_actions_1.undimEverything)(),
        (0, machine_actions_1.returnViewportBefore)(),
        emitWalkthroughStopped(),
    ],
    on: {
        'key.esc': {
            target: machine_setup_1.targetState.idle,
        },
        'key.arrow.left': {
            actions: (0, actions_1.raise)({ type: 'walkthrough.step', direction: 'previous' }),
        },
        'key.arrow.up': {
            actions: (0, actions_1.raise)({ type: 'walkthrough.step', direction: 'previous' }),
        },
        'key.arrow.right': {
            actions: (0, actions_1.raise)({ type: 'walkthrough.step', direction: 'next' }),
        },
        'key.arrow.down': {
            actions: (0, actions_1.raise)({ type: 'walkthrough.step', direction: 'next' }),
        },
        'walkthrough.step': {
            actions: [
                (0, actions_1.assign)(function (_a) {
                    var context = _a.context, event = _a.event;
                    var stepId = context.activeWalkthrough.stepId;
                    var stepIndex = context.xyedges.findIndex(function (e) { return e.id === stepId; });
                    var nextStepIndex = (0, remeda_1.clamp)(event.direction === 'next' ? stepIndex + 1 : stepIndex - 1, {
                        min: 0,
                        max: context.xyedges.length - 1,
                    });
                    if (nextStepIndex === stepIndex) {
                        return {};
                    }
                    var nextStepId = (0, core_1.nonNullable)(context.xyedges[nextStepIndex]).id;
                    return {
                        activeWalkthrough: {
                            stepId: nextStepId,
                            parallelPrefix: (0, core_1.getParallelStepsPrefix)(nextStepId),
                        },
                    };
                }),
                updateActiveWalkthroughState(),
                (0, machine_actions_1.fitFocusedBounds)(),
                emitWalkthroughStep(),
            ],
        },
        'xyflow.edgeClick': [
            {
                guard: 'click: active walkthrough step',
                actions: [
                    (0, machine_actions_1.fitFocusedBounds)(),
                    (0, machine_actions_1.emitEdgeClick)(),
                ],
            },
            {
                actions: [
                    (0, actions_1.assign)(function (_a) {
                        var event = _a.event;
                        var stepId = event.edge.id;
                        (0, core_1.invariant)((0, core_1.isStepEdgeId)(stepId));
                        return {
                            activeWalkthrough: {
                                stepId: stepId,
                                parallelPrefix: (0, core_1.getParallelStepsPrefix)(stepId),
                            },
                        };
                    }),
                    updateActiveWalkthroughState(),
                    (0, machine_actions_1.fitFocusedBounds)(),
                    (0, machine_actions_1.emitEdgeClick)(),
                    emitWalkthroughStep(),
                ],
            },
        ],
        'notations.unhighlight': {
            actions: updateActiveWalkthroughState(),
        },
        'tag.unhighlight': {
            actions: updateActiveWalkthroughState(),
        },
        'update.view': {
            guard: 'is same view',
            actions: [
                (0, machine_actions_1.updateView)(),
                updateActiveWalkthroughState(),
            ],
        },
        'walkthrough.end': {
            target: machine_setup_1.targetState.idle,
        },
        'xyflow.paneDblClick': {
            target: machine_setup_1.targetState.idle,
        },
    },
});
