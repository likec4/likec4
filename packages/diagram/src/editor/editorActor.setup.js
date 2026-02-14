"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.machine = void 0;
var xstate_1 = require("xstate");
var hotkeyActor_1 = require("./hotkeyActor");
var applyLatest = (0, xstate_1.fromPromise)(function () {
    throw new Error('Not implemented');
});
var executeChange = (0, xstate_1.fromPromise)(function () {
    throw new Error('Not implemented');
});
exports.machine = (0, xstate_1.setup)({
    types: {
        context: {},
        events: {},
        emitted: {},
        input: {},
        children: {},
        tags: {},
    },
    delays: {
        '500ms': 500,
        'waitBeforeSync': 2000,
    },
    actors: {
        applyLatest: applyLatest,
        executeChange: executeChange,
        hotkey: hotkeyActor_1.hotkeyActorLogic,
    },
    guards: {
        'has pending': function (_a) {
            var context = _a.context;
            return context.pendingChanges.length > 0;
        },
        'can undo': function (_a) {
            var context = _a.context;
            return context.history.length > 0;
        },
    },
});
