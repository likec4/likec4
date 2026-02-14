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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.overlaysActorLogic = void 0;
var hooks_1 = require("@mantine/hooks");
var remeda_1 = require("remeda");
var xstate_1 = require("xstate");
var guards_1 = require("xstate/guards");
var actor_1 = require("./element-details/actor");
var actor_2 = require("./relationship-details/actor");
var actor_3 = require("./relationships-browser/actor");
// TODO: naming convention for actors
var hotkeyLogic = (0, xstate_1.fromCallback)(function (_a) {
    var sendBack = _a.sendBack;
    var handler = (0, hooks_1.getHotkeyHandler)([
        ['Escape', function (event) {
                event.stopPropagation();
                sendBack({ type: 'close' });
            }, {
                preventDefault: true,
            }],
    ]);
    document.body.addEventListener('keydown', handler, { capture: true });
    return function () {
        document.body.removeEventListener('keydown', handler, { capture: true });
    };
});
var machine = (0, xstate_1.setup)({
    types: {
        context: {},
        events: {},
        emitted: {},
        children: {},
    },
    actors: {
        relationshipDetails: actor_2.relationshipDetailsLogic,
        elementDetails: actor_1.elementDetailsLogic,
        relationshipsBrowser: actor_3.relationshipsBrowserLogic,
        hotkey: hotkeyLogic,
    },
    guards: {
        'has overlays?': function (_a) {
            var context = _a.context;
            return context.overlays.length > 0;
        },
        'close specific overlay?': function (_a) {
            var context = _a.context, event = _a.event;
            (0, xstate_1.assertEvent)(event, 'close');
            return (0, remeda_1.isString)(event.actorId) && context.overlays.some(function (o) { return o.id === event.actorId; });
        },
        'last: is relationshipDetails?': function (_a) {
            var context = _a.context;
            var lastOverlay = (0, remeda_1.last)(context.overlays);
            return (lastOverlay === null || lastOverlay === void 0 ? void 0 : lastOverlay.type) === 'relationshipDetails';
        },
        'last: is relationshipsBrowser?': function (_a) {
            var context = _a.context;
            var lastOverlay = (0, remeda_1.last)(context.overlays);
            return (lastOverlay === null || lastOverlay === void 0 ? void 0 : lastOverlay.type) === 'relationshipsBrowser';
        },
    },
});
var emitOpened = function (overlay) {
    return machine.emit({
        type: 'opened',
        overlay: overlay.split('-')[0],
    });
};
var emitClosed = function (overlay) {
    return machine.emit({
        type: 'closed',
        overlay: overlay.split('-')[0],
    });
};
var emitIdle = function () { return machine.emit({ type: 'idle' }); };
var closeLastOverlay = function () {
    return machine.enqueueActions(function (_a) {
        var _b;
        var context = _a.context, enqueue = _a.enqueue;
        if (context.overlays.length === 0) {
            return;
        }
        var lastOverlay = (_b = (0, remeda_1.last)(context.overlays)) === null || _b === void 0 ? void 0 : _b.id;
        if (!lastOverlay) {
            return;
        }
        enqueue.sendTo(lastOverlay, { type: 'close' });
        enqueue.stopChild(lastOverlay);
        enqueue.assign({
            overlays: context.overlays.filter(function (o) { return o.id !== lastOverlay; }),
        });
        enqueue(emitClosed(lastOverlay));
    });
};
var closeSpecificOverlay = function () {
    return machine.enqueueActions(function (_a) {
        var _b;
        var context = _a.context, enqueue = _a.enqueue, event = _a.event;
        (0, xstate_1.assertEvent)(event, 'close');
        var actorId = event.actorId;
        if (!(0, remeda_1.isString)(actorId)) {
            return;
        }
        var toClose = (_b = context.overlays.find(function (o) { return o.id === actorId; })) === null || _b === void 0 ? void 0 : _b.id;
        if (toClose) {
            enqueue.sendTo(toClose, { type: 'close' });
            enqueue.stopChild(toClose);
            enqueue.assign({
                overlays: context.overlays.filter(function (o) { return o.id !== toClose; }),
            });
            enqueue(emitClosed(toClose));
        }
    });
};
var closeAllOverlays = function () {
    return machine.enqueueActions(function (_a) {
        var context = _a.context, enqueue = _a.enqueue;
        for (var _i = 0, _b = (0, remeda_1.reverse)(context.overlays); _i < _b.length; _i++) {
            var id = _b[_i].id;
            enqueue.sendTo(id, { type: 'close' });
            enqueue.stopChild(id);
            enqueue(emitClosed(id));
        }
        enqueue.assign({ overlays: [] });
    });
};
var openElementDetails = function () {
    return machine.enqueueActions(function (_a) {
        var context = _a.context, enqueue = _a.enqueue, event = _a.event;
        (0, xstate_1.assertEvent)(event, 'open.elementDetails');
        if (context.overlays.some(function (o) { return o.type === 'elementDetails' && o.subject === event.subject; })) {
            return;
        }
        var id = "elementDetails-".concat(context.seq);
        enqueue.spawnChild('elementDetails', {
            id: id,
            input: event,
            syncSnapshot: true,
        });
        enqueue.assign({
            seq: context.seq + 1,
            overlays: __spreadArray(__spreadArray([], context.overlays, true), [
                {
                    id: id,
                    type: 'elementDetails',
                    subject: event.subject,
                },
            ], false),
        });
        enqueue(emitOpened(id));
    });
};
var openRelationshipDetails = function () {
    return machine.enqueueActions(function (_a) {
        var context = _a.context, enqueue = _a.enqueue, event = _a.event;
        (0, xstate_1.assertEvent)(event, 'open.relationshipDetails');
        var currentOverlay = (0, remeda_1.last)(context.overlays);
        if ((currentOverlay === null || currentOverlay === void 0 ? void 0 : currentOverlay.type) === 'relationshipDetails') {
            enqueue.sendTo(currentOverlay.id, __assign(__assign({}, event), { type: 'navigate.to' }));
            return;
        }
        var id = "relationshipDetails-".concat(context.seq);
        enqueue.spawnChild('relationshipDetails', {
            id: id,
            input: event,
            syncSnapshot: true,
        });
        enqueue.assign({
            seq: context.seq + 1,
            overlays: __spreadArray(__spreadArray([], context.overlays, true), [
                {
                    id: id,
                    type: 'relationshipDetails',
                },
            ], false),
        });
        enqueue(emitOpened(id));
    });
};
var openRelationshipsBrowser = function () {
    return machine.enqueueActions(function (_a) {
        var context = _a.context, enqueue = _a.enqueue, event = _a.event;
        (0, xstate_1.assertEvent)(event, 'open.relationshipsBrowser');
        var currentOverlay = (0, remeda_1.last)(context.overlays);
        if ((currentOverlay === null || currentOverlay === void 0 ? void 0 : currentOverlay.type) === 'relationshipsBrowser') {
            enqueue.sendTo(currentOverlay.id, {
                type: 'navigate.to',
                subject: event.subject,
                viewId: event.viewId,
            });
            return;
        }
        var id = "relationshipsBrowser-".concat(context.seq);
        enqueue.spawnChild('relationshipsBrowser', {
            id: id,
            input: event,
            syncSnapshot: true,
        });
        enqueue.assign({
            seq: context.seq + 1,
            overlays: __spreadArray(__spreadArray([], context.overlays, true), [
                {
                    id: id,
                    type: 'relationshipsBrowser',
                    subject: event.subject,
                },
            ], false),
        });
        enqueue(emitOpened(id));
    });
};
var openOverlay = function () {
    return machine.enqueueActions(function (_a) {
        var enqueue = _a.enqueue, event = _a.event;
        (0, xstate_1.assertEvent)(event, [
            'open.elementDetails',
            'open.relationshipDetails',
            'open.relationshipsBrowser',
        ]);
        switch (event.type) {
            case 'open.elementDetails':
                enqueue(openElementDetails());
                break;
            case 'open.relationshipDetails':
                enqueue(openRelationshipDetails());
                break;
            case 'open.relationshipsBrowser':
                enqueue(openRelationshipsBrowser());
                break;
        }
    });
};
var listenToEsc = function () {
    return machine.spawnChild('hotkey', {
        id: 'hotkey',
    });
};
var stopListeningToEsc = function () { return machine.stopChild('hotkey'); };
var checkState = function () {
    return machine.enqueueActions(function (_a) {
        var enqueue = _a.enqueue, context = _a.context;
        if (context.overlays.length === 0) {
            // No more overlays, go to idle by raising close again
            enqueue.raise({ type: 'close' });
        }
    });
};
var _overlaysActorLogic = machine.createMachine({
    id: 'overlays',
    context: function () { return ({
        seq: 1,
        overlays: [],
    }); },
    initial: 'idle',
    states: {
        idle: {
            entry: [
                emitIdle(),
            ],
            on: {
                'open.*': {
                    actions: openOverlay(),
                    target: 'active',
                },
            },
        },
        active: {
            entry: [
                listenToEsc(),
            ],
            exit: [
                stopListeningToEsc(),
            ],
            on: {
                'open.*': {
                    actions: openOverlay(),
                },
                'close': [
                    {
                        guard: (0, guards_1.not)('has overlays?'),
                        target: 'idle',
                    },
                    {
                        guard: 'close specific overlay?',
                        actions: [
                            closeSpecificOverlay(),
                            checkState(),
                        ],
                    },
                    {
                        actions: [
                            closeLastOverlay(),
                            checkState(),
                        ],
                    },
                ],
                'close.all': {
                    actions: [
                        closeAllOverlays(),
                    ],
                    target: 'idle',
                },
            },
        },
        final: {
            entry: [
                closeAllOverlays(),
                stopListeningToEsc(),
            ],
            type: 'final',
        },
    },
});
exports.overlaysActorLogic = _overlaysActorLogic;
