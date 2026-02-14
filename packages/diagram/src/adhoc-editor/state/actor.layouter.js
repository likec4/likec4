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
exports.layouter = exports.emitViewUpdate = void 0;
var utils_1 = require("@likec4/core/utils");
var remeda_1 = require("remeda");
var xstate_1 = require("xstate");
var actor_types_1 = require("./actor.types");
var to = {
    idle: { target: '#layouter-idle' },
    call: { target: '#layouter-call' },
};
var idle = actor_types_1.machine.createStateConfig({
    id: to.idle.target.substring(1),
    entry: (0, xstate_1.log)('entry idle ->'),
    exit: (0, xstate_1.log)(' -> idle exit '),
    on: {
        'layout': __assign({}, to.call),
    },
});
var emitViewUpdate = function () { return actor_types_1.machine.emit({ type: 'view.update' }); };
exports.emitViewUpdate = emitViewUpdate;
var selectEnabled = (0, remeda_1.piped)((0, remeda_1.filter)(function (rule) { return rule.enabled; }), (0, remeda_1.map)(actor_types_1.ruleToPredicate));
var call = actor_types_1.machine.createStateConfig({
    id: to.call.target.substring(1),
    entry: (0, xstate_1.log)('entry call ->'),
    exit: (0, xstate_1.log)(' -> call exit '),
    invoke: {
        src: 'service',
        input: function (_a) {
            var context = _a.context;
            return ({
                predicates: selectEnabled(context.rules),
            });
        },
        onDone: __assign({ actions: [
                (0, xstate_1.assign)({
                    view: function (_a) {
                        var context = _a.context, event = _a.event;
                        var id = (0, utils_1.objectHash)(selectEnabled(context.rules));
                        return (__assign(__assign({}, event.output.view), { hash: id, id: id }));
                    },
                    error: undefined,
                }),
                (0, xstate_1.emit)({ type: 'view.update' }),
            ] }, to.idle),
        onError: __assign({ actions: [
                (0, xstate_1.log)(function (_a) {
                    var event = _a.event;
                    return "error: ".concat(event.error);
                }),
                (0, xstate_1.assign)({
                    error: function (_a) {
                        var event = _a.event;
                        return "".concat(event.error);
                    },
                }),
            ] }, to.idle),
    },
});
exports.layouter = actor_types_1.machine.createStateConfig({
    initial: 'idle',
    states: {
        idle: idle,
        call: call,
    },
});
