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
exports.isReady = exports.initializing = void 0;
var actions_1 = require("xstate/actions");
var machine_actions_1 = require("./machine.actions");
var machine_actions_layout_1 = require("./machine.actions.layout");
var machine_setup_1 = require("./machine.setup");
/**
 * To be in `initializing` state, the diagram must wait for two events:
 * - `xyflow.init` - indicates that the `xyflow` instance is ready
 * - `update.view` - provides the initial diagram data (nodes and edges)
 *
 * Once both events have been received, the diagram transitions to `isReady` state.
 */
exports.initializing = machine_setup_1.machine.createStateConfig({
    on: {
        'xyflow.init': {
            actions: (0, actions_1.assign)(function (_a) {
                var context = _a.context, event = _a.event;
                return ({
                    initialized: __assign(__assign({}, context.initialized), { xyflow: true }),
                    xyflow: event.instance,
                });
            }),
            target: 'isReady',
        },
        'update.view': {
            actions: [
                (0, machine_actions_1.assignXYDataFromView)(),
                (0, actions_1.assign)(function (_a) {
                    var context = _a.context;
                    return ({
                        initialized: __assign(__assign({}, context.initialized), { xydata: true }),
                    });
                }),
            ],
            target: 'isReady',
        },
    },
});
/**
 * State that checks whether the diagram is ready to be used.
 * Transitions to `ready` state if both `xyflow` and `xydata` are initialized,
 * otherwise goes back to `initializing` state.`
 */
exports.isReady = machine_setup_1.machine.createStateConfig({
    always: [{
            guard: 'isReady',
            actions: [
                (0, machine_actions_layout_1.fitDiagram)({ duration: 0 }),
                (0, actions_1.assign)(function (_a) {
                    var context = _a.context;
                    return ({
                        navigationHistory: {
                            currentIndex: 0,
                            history: [{
                                    viewId: context.view.id,
                                    viewport: __assign({}, context.xyflow.getViewport()),
                                    viewportChangedManually: false,
                                }],
                        },
                    });
                }),
                (0, machine_actions_1.emitInitialized)(),
            ],
            target: 'ready',
        }, {
            target: 'initializing',
        }],
});
