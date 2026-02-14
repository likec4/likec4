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
exports.printing = void 0;
var xstate_1 = require("xstate");
var machine_actions_1 = require("./machine.actions");
var machine_setup_1 = require("./machine.setup");
var utils_1 = require("./utils");
/**
 * State when the diagram is being prepared for printing.
 * Adjusts the viewport to fit the entire diagram for optimal printing.
 * Restores the previous viewport upon exiting the state.
 */
exports.printing = machine_setup_1.machine.createStateConfig({
    id: machine_setup_1.targetState.printing.slice(1),
    entry: [
        (0, machine_actions_1.cancelFitDiagram)(),
        (0, machine_actions_1.assignViewportBefore)(),
        (0, xstate_1.enqueueActions)(function (_a) {
            var enqueue = _a.enqueue, context = _a.context;
            var bounds = (0, utils_1.viewBounds)(context);
            var OFFSET = 16;
            enqueue((0, machine_actions_1.setViewport)({
                viewport: {
                    x: bounds.x + OFFSET,
                    y: bounds.y + OFFSET,
                    zoom: 1,
                },
                duration: 0,
            }));
        }),
    ],
    exit: [
        (0, machine_actions_1.returnViewportBefore)({ delay: 0, duration: 0 }),
    ],
    on: {
        'media.print.off': __assign({}, machine_setup_1.to.idle),
        '*': {
            actions: [
                (0, xstate_1.log)(function (_a) {
                    var event = _a.event;
                    return "Printing state - ignoring event: ".concat(event.type);
                }),
            ],
        },
    },
});
