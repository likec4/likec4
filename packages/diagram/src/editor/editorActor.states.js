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
exports.editorActorLogic = void 0;
var remeda_1 = require("remeda");
var xstate_1 = require("xstate");
var editorActor_actions_1 = require("./editorActor.actions");
var editorActor_setup_1 = require("./editorActor.setup");
/**
 * Actually this is DiagramActorRef
 * But we can't use it here due to circular type inference
 */
var diagramActorRef = function (params) {
    return params.system.get('diagram');
};
var to = {
    idle: { target: '#idle' },
    editing: { target: '#editing' },
    afterEdit: { target: '#afterEdit' },
    pending: { target: '#pending' },
    applyLatestToManual: { target: '#applyLatestToManual' },
    executeChanges: { target: '#executeChanges' },
};
/**
 * Idle state, no pending operations
 */
var idle = editorActor_setup_1.machine.createStateConfig({
    id: 'idle',
    on: {
        'sync': __assign({}, to.pending),
        'edit.start': __assign({}, to.editing),
    },
});
/**
 * Edit state, some operation is in progress, come to this state from idle
 */
var editing = editorActor_setup_1.machine.createStateConfig({
    id: 'editing',
    tags: 'pending',
    entry: [
        (0, editorActor_actions_1.startEditing)(),
        (0, editorActor_actions_1.cancelSync)(),
    ],
    on: {
        change: __assign({ actions: (0, editorActor_actions_1.stopEditing)() }, to.executeChanges),
        'edit.finish': __assign({ actions: (0, editorActor_actions_1.stopEditing)() }, to.afterEdit),
        'undo': __assign({ actions: (0, editorActor_actions_1.stopEditing)() }, to.idle),
    },
});
/**
 * Syncing state, some edits are not yet synced
 */
var pending = editorActor_setup_1.machine.createStateConfig({
    id: 'pending',
    tags: ['pending'],
    entry: (0, editorActor_actions_1.ensureHotKey)(),
    on: {
        'sync': __assign({ reenter: true }, to.pending),
        'edit.start': __assign({ 
            // this allows to return back from editing in afterEdit state
            actions: [
                (0, editorActor_actions_1.addSnapshotToPendingChanges)(),
            ] }, to.editing),
    },
    after: {
        'waitBeforeSync': __assign({ actions: [
                (0, editorActor_actions_1.addSnapshotToPendingChanges)(),
            ] }, to.executeChanges),
    },
});
/**
 * Decide where to go next
 */
var afterEdit = editorActor_setup_1.machine.createStateConfig({
    id: 'afterEdit',
    always: [
        __assign({ guard: 'has pending' }, to.pending),
        __assign({}, to.idle),
    ],
});
/**
 * Syncing state, some edits are not yet synced
 */
var applyLatestToManual = editorActor_setup_1.machine.createStateConfig({
    id: 'applyLatestToManual',
    entry: [
        (0, editorActor_actions_1.cancelSync)(),
        (0, editorActor_actions_1.saveStateBeforeEdit)(),
    ],
    initial: 'call',
    states: {
        // Fetch latest and manual layouts
        // Apply changes, send update to diagram
        call: {
            invoke: {
                src: 'applyLatest',
                input: function (_a) {
                    var _b;
                    var context = _a.context;
                    var current = (_b = context.beforeEditing) === null || _b === void 0 ? void 0 : _b.change.layout;
                    return ({
                        current: current && current._layout === 'manual' ? current : undefined,
                        viewId: context.viewId,
                    });
                },
                onDone: {
                    actions: (0, xstate_1.sendTo)(diagramActorRef, function (_a) {
                        var event = _a.event;
                        return ({
                            type: 'update.view',
                            view: event.output.updated,
                        });
                    }, { delay: 10 }),
                    target: 'wait',
                },
                onError: __assign({ actions: [
                        (0, xstate_1.assign)({
                            beforeEditing: null,
                            pendingChanges: [],
                        }),
                        function (_a) {
                            var event = _a.event;
                            console.error(event.error);
                        },
                    ] }, to.idle),
            },
        },
        // Now we wait 350ms, take new snapshot and send save-view-snapshot
        wait: {
            entry: (0, editorActor_actions_1.pushHistory)(),
            on: {
                '*': {
                    actions: [
                        (0, xstate_1.log)(function (_a) {
                            var event = _a.event;
                            return "wait received unexpected event: ".concat(event.type);
                        }),
                        (0, editorActor_actions_1.reschedule)(500),
                    ],
                },
            },
            after: {
                '500ms': __assign({ actions: [
                        (0, editorActor_actions_1.addSnapshotToPendingChanges)(),
                        (0, editorActor_actions_1.ensureHotKey)(),
                    ] }, to.executeChanges),
            },
        },
    },
});
/**
 * Calls `executeChange` to save the snapshot
 */
var executeChanges = editorActor_setup_1.machine.createStateConfig({
    id: 'executeChanges',
    entry: [
        (0, xstate_1.assign)(function (_a) {
            var event = _a.event, context = _a.context;
            if (import.meta.env.DEV) {
                console.log('executeChanges entry', { event: event });
            }
            if (event.type === 'change') {
                if ((0, editorActor_actions_1.isLayoutChange)(event.change)) {
                    return {
                        pendingChanges: __spreadArray(__spreadArray([], (0, editorActor_actions_1.withoutSnapshotChanges)(context.pendingChanges), true), [
                            event.change,
                        ], false),
                    };
                }
                if (!context.pendingChanges.includes(event.change)) {
                    return {
                        pendingChanges: __spreadArray(__spreadArray([], context.pendingChanges, true), [
                            event.change,
                        ], false),
                    };
                }
            }
            return {};
        }),
        (0, editorActor_actions_1.cancelSync)(),
    ],
    invoke: {
        src: 'executeChange',
        input: function (_a) {
            var context = _a.context;
            return ({
                changes: context.pendingChanges,
                viewId: context.viewId,
            });
        },
        onDone: __assign({ actions: (0, xstate_1.enqueueActions)(function (_a) {
                var context = _a.context, event = _a.event, enqueue = _a.enqueue;
                if (import.meta.env.DEV) {
                    console.log('executeChanges onDone', { event: event });
                }
                var snapshot = (0, remeda_1.find)(context.pendingChanges, function (c) { return c.op === 'save-view-snapshot'; });
                if (snapshot) {
                    enqueue.sendTo(diagramActorRef, {
                        type: 'update.view-bounds',
                        bounds: snapshot.layout.bounds,
                    });
                }
                enqueue.assign({
                    pendingChanges: [],
                });
            }) }, to.idle),
        onError: __assign({ actions: (0, xstate_1.assign)(function (_a) {
                var event = _a.event;
                console.error('executeChanges onError', { error: event.error });
                return {
                    pendingChanges: [],
                };
            }) }, to.idle),
    },
});
var _editorActorLogic = editorActor_setup_1.machine.createMachine({
    id: 'editor',
    context: function (_a) {
        var input = _a.input;
        return ({
            viewId: input.viewId,
            beforeEditing: null,
            editing: null,
            pendingChanges: [],
            history: [],
        });
    },
    initial: 'idle',
    states: {
        idle: idle,
        editing: editing,
        pending: pending,
        afterEdit: afterEdit,
        applyLatestToManual: applyLatestToManual,
        executeChanges: executeChanges,
    },
    on: {
        cancel: __assign({ actions: [
                (0, editorActor_actions_1.cancelSync)(),
                (0, xstate_1.assign)({
                    editing: null,
                    beforeEditing: null,
                    pendingChanges: [],
                }),
            ] }, to.idle),
        synced: {
            actions: (0, editorActor_actions_1.markHistoryAsSynched)(),
        },
        undo: __assign({ guard: 'can undo', actions: (0, editorActor_actions_1.undo)() }, to.idle),
        change: __assign({}, to.executeChanges),
        'applyLatestToManual': __assign({}, to.applyLatestToManual),
        reset: __assign({ actions: [
                (0, editorActor_actions_1.cancelSync)(),
                (0, xstate_1.assign)({
                    history: [],
                    editing: null,
                    beforeEditing: null,
                    pendingChanges: [],
                }),
                (0, editorActor_actions_1.stopHotkey)(),
            ] }, to.idle),
    },
});
exports.editorActorLogic = _editorActorLogic;
