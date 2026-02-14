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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
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
exports.addSnapshotToPendingChanges = exports.undo = exports.popHistory = exports.markHistoryAsSynched = exports.stopEditing = exports.pushHistory = exports.ensureHotKey = exports.stopHotkey = exports.startEditing = exports.saveStateBeforeEdit = exports.withoutSnapshotChanges = exports.isLayoutChange = exports.reschedule = exports.cancelSync = exports.raiseSync = void 0;
var remeda_1 = require("remeda");
var createViewChange_1 = require("../likec4diagram/state/createViewChange");
var editorActor_setup_1 = require("./editorActor.setup");
/**
 * Actually this is DiagramActorRef
 * But we can't use it here due to circular type inference
 */
var diagramActorRef = function (system) {
    return system.get('diagram');
};
/**
 * Actually this is DiagramActorRef
 * But we can't use it here due to circular type inference
 */
var getDiagramContext = function (system) {
    return system.get('diagram').getSnapshot().context;
};
var raiseSync = function () { return editorActor_setup_1.machine.raise({ type: 'sync' }, { delay: 200, id: 'sync' }); };
exports.raiseSync = raiseSync;
var cancelSync = function () { return editorActor_setup_1.machine.cancel('sync'); };
exports.cancelSync = cancelSync;
var reschedule = function (delay) {
    if (delay === void 0) { delay = 350; }
    return editorActor_setup_1.machine.raise(function (_a) {
        var event = _a.event;
        return event;
    }, { delay: delay });
};
exports.reschedule = reschedule;
var isLayoutChange = function (change) { return change.op === 'reset-manual-layout' || change.op === 'save-view-snapshot'; };
exports.isLayoutChange = isLayoutChange;
exports.withoutSnapshotChanges = (0, remeda_1.filter)((0, remeda_1.isNot)(exports.isLayoutChange));
var saveStateBeforeEdit = function () {
    return editorActor_setup_1.machine.assign(function (_a) {
        var system = _a.system;
        var parentContext = getDiagramContext(system);
        return {
            beforeEditing: {
                xynodes: parentContext.xynodes.map(function (_a) {
                    var _b, _c, _d, _e;
                    var measured = _a.measured, data = _a.data, n = __rest(_a, ["measured", "data"]);
                    return (__assign(__assign({}, (0, remeda_1.omit)(n, ['selected', 'dragging', 'resizing'])), { data: (0, remeda_1.omit)(data, ['dimmed', 'hovered']), measured: measured, initialWidth: (_c = (_b = measured === null || measured === void 0 ? void 0 : measured.width) !== null && _b !== void 0 ? _b : n.width) !== null && _c !== void 0 ? _c : n.initialWidth, initialHeight: (_e = (_d = measured === null || measured === void 0 ? void 0 : measured.height) !== null && _d !== void 0 ? _d : n.height) !== null && _e !== void 0 ? _e : n.initialHeight }));
                }),
                xyedges: parentContext.xyedges.map(function (_a) {
                    var data = _a.data, e = __rest(_a, ["data"]);
                    return (__assign(__assign({}, (0, remeda_1.omit)(e, ['selected'])), { data: (0, remeda_1.omit)(data, ['active', 'dimmed', 'hovered']) }));
                }),
                change: (0, createViewChange_1.createViewChange)(parentContext),
                view: parentContext.view,
                synched: false,
            },
        };
    });
};
exports.saveStateBeforeEdit = saveStateBeforeEdit;
var startEditing = function () {
    return editorActor_setup_1.machine.enqueueActions(function (_a) {
        var enqueue = _a.enqueue, event = _a.event;
        enqueue((0, exports.saveStateBeforeEdit)());
        if (event.type === 'edit.start') {
            enqueue.assign({
                editing: event.subject,
            });
        }
    });
};
exports.startEditing = startEditing;
var stopHotkey = function () { return editorActor_setup_1.machine.stopChild('hotkey'); };
exports.stopHotkey = stopHotkey;
var ensureHotKey = function () {
    return editorActor_setup_1.machine.enqueueActions(function (_a) {
        var check = _a.check, enqueue = _a.enqueue, self = _a.self;
        var hasUndo = check('can undo');
        var hotkey = self.getSnapshot().children['hotkey'];
        if (!hasUndo && hotkey) {
            enqueue.stopChild(hotkey);
            return;
        }
        if (hasUndo && !hotkey) {
            enqueue.spawnChild('hotkey', {
                id: 'hotkey',
            });
        }
    });
};
exports.ensureHotKey = ensureHotKey;
var pushHistory = function () {
    return editorActor_setup_1.machine.assign(function (_a) {
        var context = _a.context;
        var snapshot = context.beforeEditing;
        if (!snapshot) {
            // If we have beforeEditing snapshot, do not push history
            return {
                editing: null,
            };
        }
        var history = __spreadArray(__spreadArray([], context.history, true), [
            snapshot,
        ], false);
        if (history.length > 50) {
            history.shift();
        }
        return {
            beforeEditing: null,
            editing: null,
            history: history,
        };
    });
};
exports.pushHistory = pushHistory;
var stopEditing = function () {
    return editorActor_setup_1.machine.enqueueActions(function (_a) {
        var event = _a.event, enqueue = _a.enqueue;
        if (event.type === 'edit.finish' && event.wasChanged) {
            enqueue((0, exports.pushHistory)());
            enqueue((0, exports.raiseSync)());
            return;
        }
        enqueue.assign({
            beforeEditing: null,
            editing: null,
        });
    });
};
exports.stopEditing = stopEditing;
var markHistoryAsSynched = function () {
    return editorActor_setup_1.machine.assign(function (_a) {
        var context = _a.context;
        return {
            beforeEditing: context.beforeEditing && context.beforeEditing.synched === false
                ? __assign(__assign({}, context.beforeEditing), { synched: true }) : context.beforeEditing,
            history: context.history.map(function (i) { return (__assign(__assign({}, i), { synched: true })); }),
        };
    });
};
exports.markHistoryAsSynched = markHistoryAsSynched;
var popHistory = function () {
    return editorActor_setup_1.machine.assign(function (_a) {
        var context = _a.context;
        if (context.history.length <= 1) {
            return {
                history: [],
            };
        }
        return {
            history: context.history.slice(0, context.history.length - 1),
        };
    });
};
exports.popHistory = popHistory;
var undo = function () {
    return editorActor_setup_1.machine.enqueueActions(function (_a) {
        var context = _a.context, enqueue = _a.enqueue, system = _a.system;
        var lastHistoryItem = (0, remeda_1.last)(context.history);
        if (!lastHistoryItem) {
            return;
        }
        if (import.meta.env.DEV) {
            console.log('undo');
        }
        enqueue((0, exports.cancelSync)());
        enqueue((0, exports.popHistory)());
        enqueue((0, exports.ensureHotKey)());
        var diagramActor = diagramActorRef(system);
        enqueue.sendTo(diagramActor, {
            type: 'update.view',
            view: lastHistoryItem.view,
            xyedges: lastHistoryItem.xyedges,
            xynodes: lastHistoryItem.xynodes,
            source: 'editor',
        });
        enqueue.assign({
            pendingChanges: [],
        });
        // If the last history item was already synched,
        // we need to emit change event
        if (lastHistoryItem.synched) {
            enqueue.raise({ type: 'change', change: lastHistoryItem.change }, { delay: 50 });
        }
        else {
            // Otherwise, we need to start sync after undo
            enqueue((0, exports.raiseSync)());
        }
    });
};
exports.undo = undo;
var addSnapshotToPendingChanges = function () {
    return editorActor_setup_1.machine.assign(function (_a) {
        var context = _a.context, system = _a.system;
        var parentContext = getDiagramContext(system);
        var change = (0, createViewChange_1.createViewChange)(parentContext);
        return {
            pendingChanges: __spreadArray(__spreadArray([], (0, exports.withoutSnapshotChanges)(context.pendingChanges), true), [
                change,
            ], false),
        };
    });
};
exports.addSnapshotToPendingChanges = addSnapshotToPendingChanges;
