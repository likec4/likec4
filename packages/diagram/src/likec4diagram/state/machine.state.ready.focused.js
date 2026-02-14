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
exports.focused = void 0;
var actions_1 = require("xstate/actions");
var guards_1 = require("xstate/guards");
var machine_actions_1 = require("./machine.actions");
var machine_setup_1 = require("./machine.setup");
exports.focused = machine_setup_1.machine.createStateConfig({
    id: machine_setup_1.targetState.focused.slice(1),
    entry: [
        (0, machine_actions_1.cancelFitDiagram)(),
        (0, machine_actions_1.focusOnNodesAndEdges)(),
        (0, machine_actions_1.assignViewportBefore)(),
        (0, machine_actions_1.openSourceOfFocusedOrLastClickedNode)(),
        (0, machine_actions_1.startHotKeyActor)(),
        (0, machine_actions_1.fitFocusedBounds)(),
        (0, machine_actions_1.startAutoUnfocusTimer)(),
    ],
    exit: [
        (0, machine_actions_1.stopHotKeyActor)(),
        (0, machine_actions_1.undimEverything)(),
        (0, machine_actions_1.returnViewportBefore)(),
        (0, machine_actions_1.cancelAutoUnfocusTimer)(),
        (0, actions_1.assign)({
            focusedNode: null,
            autoUnfocusTimer: false,
        }),
    ],
    on: {
        'focus.autoUnfocus': __assign({}, machine_setup_1.to.idle),
        'xyflow.nodeClick': [
            {
                guard: (0, guards_1.and)([
                    'enabled: ElementDetails',
                    'click: focused node',
                    'click: node has modelFqn',
                ]),
                actions: [
                    (0, machine_actions_1.assignLastClickedNode)(),
                    (0, machine_actions_1.openElementDetails)(),
                    (0, machine_actions_1.emitNodeClick)(),
                ],
            },
            __assign({ guard: 'click: focused node', actions: [
                    (0, machine_actions_1.assignLastClickedNode)(),
                    (0, machine_actions_1.emitNodeClick)(),
                ] }, machine_setup_1.to.idle),
            {
                actions: [
                    (0, machine_actions_1.assignLastClickedNode)(),
                    (0, actions_1.raise)(function (_a) {
                        var event = _a.event;
                        return ({
                            type: 'focus.node',
                            nodeId: event.node.id,
                        });
                    }),
                    (0, machine_actions_1.emitNodeClick)(),
                ],
            },
        ],
        'focus.node': {
            actions: [
                (0, machine_actions_1.assignFocusedNode)(),
                (0, machine_actions_1.focusOnNodesAndEdges)(),
                (0, machine_actions_1.openSourceOfFocusedOrLastClickedNode)(),
                (0, machine_actions_1.fitFocusedBounds)(),
            ],
        },
        'key.esc': __assign({}, machine_setup_1.to.idle),
        'xyflow.paneClick': __assign({ actions: [
                (0, machine_actions_1.emitPaneClick)(),
            ] }, machine_setup_1.to.idle),
        'notations.unhighlight': {
            actions: (0, machine_actions_1.focusOnNodesAndEdges)(),
        },
        'tag.unhighlight': {
            actions: (0, machine_actions_1.focusOnNodesAndEdges)(),
        },
    },
});
