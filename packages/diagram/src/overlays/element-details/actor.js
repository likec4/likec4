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
exports.elementDetailsLogic = void 0;
var xstate_1 = require("xstate");
var actor_1 = require("../relationships-browser/actor");
var _elementDetailsLogic = (0, xstate_1.setup)({
    types: {
        context: {},
        input: {},
        events: {},
        children: {},
    },
    actors: {
        relationshipsBrowserLogic: actor_1.relationshipsBrowserLogic,
    },
}).createMachine({
    id: 'element-details',
    context: function (_a) {
        var _b, _c, _d, _e;
        var input = _a.input;
        return (__assign(__assign({}, input), { initiatedFrom: {
                node: (_c = (_b = input.initiatedFrom) === null || _b === void 0 ? void 0 : _b.node) !== null && _c !== void 0 ? _c : null,
                clientRect: (_e = (_d = input.initiatedFrom) === null || _d === void 0 ? void 0 : _d.clientRect) !== null && _e !== void 0 ? _e : null,
            } }));
    },
    initial: 'active',
    states: {
        'active': {
            entry: (0, xstate_1.spawnChild)('relationshipsBrowserLogic', {
                id: function (_a) {
                    var self = _a.self;
                    return "".concat(self.id, "-relationships");
                },
                input: function (_a) {
                    var context = _a.context;
                    return ({
                        subject: context.subject,
                        viewId: context.currentView.id,
                        scope: 'view',
                        enableSelectSubject: false,
                        enableChangeScope: true,
                        closeable: false,
                    });
                },
            }),
            exit: [
                (0, xstate_1.sendTo)(function (_a) {
                    var self = _a.self;
                    return "".concat(self.id, "-relationships");
                }, { type: 'close' }),
                (0, xstate_1.stopChild)(function (_a) {
                    var self = _a.self;
                    return "".concat(self.id, "-relationships");
                }),
            ],
            on: {
                'change.subject': {
                    actions: (0, xstate_1.assign)({
                        subject: function (_a) {
                            var event = _a.event;
                            return event.subject;
                        },
                    }),
                },
                'close': 'closed',
            },
        },
        closed: {
            id: 'closed',
            type: 'final',
        },
    },
});
exports.elementDetailsLogic = _elementDetailsLogic;
