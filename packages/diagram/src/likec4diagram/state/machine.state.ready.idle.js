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
exports.idle = void 0;
var actions_1 = require("xstate/actions");
var guards_1 = require("xstate/guards");
var machine_actions_1 = require("./machine.actions");
var machine_setup_1 = require("./machine.setup");
exports.idle = machine_setup_1.machine.createStateConfig({
    id: machine_setup_1.targetState.idle.slice(1),
    on: {
        'xyflow.nodeClick': [
            __assign({ guard: (0, guards_1.and)([
                    'enabled: Readonly',
                    'enabled: FocusMode',
                    'click: node has connections',
                    (0, guards_1.or)([
                        'click: same node',
                        'click: selected node',
                    ]),
                ]), actions: [
                    (0, machine_actions_1.assignLastClickedNode)(),
                    (0, machine_actions_1.assignFocusedNode)(),
                    (0, machine_actions_1.emitNodeClick)(),
                ] }, machine_setup_1.to.focused),
            {
                guard: (0, guards_1.and)([
                    'enabled: Readonly',
                    'enabled: ElementDetails',
                    'click: node has modelFqn',
                    (0, guards_1.or)([
                        'click: same node',
                        'click: selected node',
                    ]),
                ]),
                actions: [
                    (0, machine_actions_1.assignLastClickedNode)(),
                    (0, machine_actions_1.openSourceOfFocusedOrLastClickedNode)(),
                    (0, machine_actions_1.openElementDetails)(),
                    (0, machine_actions_1.emitNodeClick)(),
                ],
            },
            {
                actions: [
                    (0, machine_actions_1.assignLastClickedNode)(),
                    (0, machine_actions_1.openSourceOfFocusedOrLastClickedNode)(),
                    (0, machine_actions_1.emitNodeClick)(),
                ],
            },
        ],
        'xyflow.paneClick': {
            actions: [
                (0, machine_actions_1.resetLastClickedNode)(),
                (0, machine_actions_1.emitPaneClick)(),
            ],
        },
        'xyflow.paneDblClick': {
            actions: [
                (0, machine_actions_1.resetLastClickedNode)(),
                (0, machine_actions_1.raiseFitDiagram)(),
                (0, machine_actions_1.emitOpenSourceOfView)(),
                (0, machine_actions_1.emitPaneClick)(),
            ],
        },
        'focus.node': [
            // Focus was initialed by the user searching (autoUnfocus=true) - always allowed
            {
                guard: 'focus.node: autoUnfocus',
                actions: (0, machine_actions_1.assignFocusedNode)(),
                target: machine_setup_1.targetState.focused,
            },
            // Regular focus - requires FocusMode to be enabled
            {
                guard: 'enabled: FocusMode',
                actions: (0, machine_actions_1.assignFocusedNode)(),
                target: machine_setup_1.targetState.focused,
            },
        ],
        'xyflow.edgeClick': {
            guard: (0, guards_1.and)([
                'enabled: Readonly',
                'is dynamic view',
                'enabled: DynamicViewWalkthrough',
                'click: selected edge',
            ]),
            actions: [
                (0, machine_actions_1.resetLastClickedNode)(),
                (0, actions_1.raise)(function (_a) {
                    var event = _a.event;
                    return ({
                        type: 'walkthrough.start',
                        stepId: event.edge.id,
                    });
                }),
                (0, machine_actions_1.emitEdgeClick)(),
            ],
        },
    },
});
