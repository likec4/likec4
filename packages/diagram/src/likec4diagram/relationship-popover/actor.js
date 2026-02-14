"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelationshipPopoverActorLogic = void 0;
var xstate_1 = require("xstate");
var _actorLogic = (0, xstate_1.setup)({
    types: {
        context: {},
        events: {},
        tags: 'opened',
    },
    delays: {
        'open timeout': function (_a) {
            var context = _a.context;
            return context.openTimeout;
        },
        'close timeout': 600,
        'long idle': 1500,
    },
    actions: {
        'update edgeId': (0, xstate_1.assign)(function (_a) {
            var context = _a.context, event = _a.event;
            (0, xstate_1.assertEvent)(event, ['xyedge.select', 'xyedge.mouseEnter']);
            return {
                edgeId: event.edgeId,
                edgeSelected: context.edgeSelected || event.type === 'xyedge.select',
            };
        }),
        'increase open timeout': (0, xstate_1.assign)(function () { return ({
            openTimeout: 800,
        }); }),
        'decrease open timeout': (0, xstate_1.assign)(function () { return ({
            openTimeout: 300,
        }); }),
        'reset edgeId': (0, xstate_1.assign)({
            edgeId: null,
            edgeSelected: false,
        }),
    },
    guards: {
        'edge was selected': function (_a) {
            var context = _a.context;
            return context.edgeSelected;
        },
        'edge was hovered': function (_a) {
            var context = _a.context;
            return !context.edgeSelected;
        },
    },
}).createMachine({
    id: 'breadcrumbs',
    context: function () { return ({
        edgeId: null,
        edgeSelected: false,
        openTimeout: 800,
    }); },
    initial: 'idle',
    on: {
        'close': {
            target: '#idle',
            actions: [
                'reset edgeId',
                'increase open timeout',
            ],
        },
    },
    states: {
        idle: {
            id: 'idle',
            on: {
                'xyedge.mouseEnter': {
                    target: 'opening',
                    actions: 'update edgeId',
                },
                'xyedge.select': {
                    target: 'active',
                    actions: 'update edgeId',
                },
            },
            after: {
                'long idle': {
                    actions: 'increase open timeout',
                },
            },
        },
        opening: {
            on: {
                'xyedge.mouseLeave': {
                    target: 'idle',
                },
                'xyedge.select': {
                    target: 'active',
                    actions: 'update edgeId',
                },
            },
            after: {
                'open timeout': {
                    actions: 'decrease open timeout',
                    target: 'active',
                },
            },
        },
        active: {
            tags: ['opened'],
            initial: 'opened',
            exit: 'reset edgeId',
            on: {
                'xyedge.unselect': {
                    target: 'idle',
                    actions: 'increase open timeout',
                },
                'xyedge.select': {
                    actions: 'update edgeId',
                },
            },
            states: {
                opened: {
                    on: {
                        'dropdown.mouseEnter': {
                            target: 'hovered',
                        },
                        'xyedge.mouseLeave': {
                            guard: 'edge was hovered',
                            target: 'closing',
                        },
                    },
                },
                hovered: {
                    on: {
                        'dropdown.mouseLeave': [
                            {
                                guard: 'edge was selected',
                                target: 'opened',
                            },
                            {
                                target: 'closing',
                            },
                        ],
                    },
                },
                closing: {
                    on: {
                        'xyedge.mouseEnter': {
                            guard: 'edge was hovered',
                            target: 'opened',
                            actions: 'update edgeId',
                        },
                        'xyedge.select': {
                            target: 'opened',
                            actions: 'update edgeId',
                        },
                        'dropdown.mouseEnter': {
                            target: 'hovered',
                        },
                    },
                    after: {
                        'close timeout': {
                            target: '#idle',
                        },
                    },
                },
            },
        },
    },
});
exports.RelationshipPopoverActorLogic = _actorLogic;
