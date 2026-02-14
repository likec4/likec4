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
exports.searchActorLogic = void 0;
var xstate_1 = require("xstate");
var utils_1 = require("../likec4diagram/state/utils");
var _searchActorLogic = (0, xstate_1.setup)({
    types: {
        context: {},
        events: {},
    },
    actions: {
        'reset navigateTo': (0, xstate_1.assign)({
            navigateTo: function () { return null; },
        }),
        'assign navigateTo': (0, xstate_1.assign)(function (_a) {
            var event = _a.event;
            (0, xstate_1.assertEvent)(event, ['navigate.to']);
            return {
                navigateTo: {
                    viewId: event.viewId,
                    focusOnElement: event.focusOnElement,
                },
            };
        }),
        'change searchValue': (0, xstate_1.assign)({
            searchValue: function (_a) {
                var _b;
                var event = _a.event, context = _a.context;
                (0, xstate_1.assertEvent)(event, ['change.search', 'open']);
                return (_b = event.search) !== null && _b !== void 0 ? _b : context.searchValue;
            },
        }),
        'reset pickViewFor': (0, xstate_1.assign)({
            pickViewFor: function () { return null; },
        }),
    },
}).createMachine({
    id: 'search',
    context: {
        openedWithSearch: null,
        searchValue: '',
        pickViewFor: null,
        navigateTo: null,
    },
    initial: 'inactive',
    on: {
        'close': {
            target: '.inactive',
        },
    },
    states: {
        inactive: {
            entry: [
                'reset navigateTo',
                'reset pickViewFor',
            ],
            on: {
                'open': {
                    target: 'opened',
                    actions: [
                        (0, xstate_1.assign)({
                            openedWithSearch: function (_a) {
                                var _b;
                                var event = _a.event;
                                return (_b = event.search) !== null && _b !== void 0 ? _b : null;
                            },
                            searchValue: function (_a) {
                                var _b;
                                var event = _a.event, context = _a.context;
                                return (_b = event.search) !== null && _b !== void 0 ? _b : context.searchValue;
                            },
                        }),
                    ],
                },
            },
        },
        opened: {
            on: {
                'open': {
                    actions: 'change searchValue',
                },
                'change.search': {
                    actions: 'change searchValue',
                },
                'pickview.open': {
                    target: 'pickView',
                    actions: (0, xstate_1.assign)({
                        pickViewFor: function (_a) {
                            var event = _a.event;
                            return event.elementFqn;
                        },
                    }),
                },
                'navigate.to': {
                    target: 'waitAnimationEnd',
                    actions: 'assign navigateTo',
                },
            },
        },
        pickView: {
            on: {
                'pickview.close': {
                    target: 'opened',
                    actions: 'reset pickViewFor',
                },
                'navigate.to': {
                    target: 'waitAnimationEnd',
                    actions: 'assign navigateTo',
                },
            },
        },
        /**
         * Wait for animation end before triggering navigation
         * Otherwise, there could be weird artifacts when navigating to large diagrams.
         */
        waitAnimationEnd: {
            on: {
                'animation.presence.end': {
                    target: 'inactive',
                    actions: (0, xstate_1.enqueueActions)(function (_a) {
                        var context = _a.context, system = _a.system, enqueue = _a.enqueue;
                        var navigateTo = context.navigateTo;
                        if (!navigateTo)
                            return;
                        enqueue('reset navigateTo');
                        var diagramActor = (0, utils_1.typedSystem)(system).diagramActorRef;
                        // If we need to focus on an element, we should not navigate to the view
                        // as it will cause the view to be re-rendered and the focus will be lost
                        if (navigateTo.focusOnElement) {
                            var viewId = diagramActor.getSnapshot().context.view.id;
                            if (viewId === navigateTo.viewId) {
                                enqueue.sendTo(diagramActor, {
                                    type: 'focus.node',
                                    nodeId: navigateTo.focusOnElement,
                                });
                                return;
                            }
                        }
                        enqueue.sendTo(diagramActor, __assign({ type: 'navigate.to' }, navigateTo));
                    }),
                },
            },
        },
    },
});
exports.searchActorLogic = _searchActorLogic;
