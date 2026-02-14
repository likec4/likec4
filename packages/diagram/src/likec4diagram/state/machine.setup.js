"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.to = exports.targetState = exports.machine = exports.deriveToggledFeatures = void 0;
// oxlint-disable triple-slash-reference
// oxlint-disable no-floating-promises
/// <reference path="../../../node_modules/xstate/dist/declarations/src/guards.d.ts" />
var core_1 = require("@likec4/core");
var remeda_1 = require("remeda");
var xstate_1 = require("xstate");
var editorActor_states_1 = require("../../editor/editorActor.states");
var overlaysActor_1 = require("../../overlays/overlaysActor");
var searchActor_1 = require("../../search/searchActor");
var hotkeyActor_1 = require("./hotkeyActor");
var mediaPrintActor_1 = require("./mediaPrintActor");
var deriveToggledFeatures = function (context) {
    var _a, _b;
    var toggledFeatures = context.toggledFeatures;
    var hasActiveWalkthrough = (0, remeda_1.isTruthy)(context.activeWalkthrough);
    var enableCompareWithLatest = context.features.enableCompareWithLatest
        && ((_a = toggledFeatures.enableCompareWithLatest) !== null && _a !== void 0 ? _a : false)
        && (0, remeda_1.isTruthy)(context.view._layout)
        // Compare with latest is disabled during active walkthrough
        && !hasActiveWalkthrough;
    /**
     * Readonly mode is enabled when:
     * - Global `features.enableReadOnly` is true (even if toggled off at runtime)
     * OR
     * - Runtime feature `ReadOnly` is toggled on (default is off)
     * OR
     * - This is a dynamic view in 'sequence' variant
     * OR
     * - There is an active walkthrough
     */
    var enableReadOnly = context.features.enableReadOnly
        || ((_b = toggledFeatures.enableReadOnly) !== null && _b !== void 0 ? _b : false)
        // Active walkthrough forces readonly
        || hasActiveWalkthrough
        // Compare with latest enforces readonly
        || (enableCompareWithLatest && context.view._layout === 'auto');
    return {
        enableCompareWithLatest: enableCompareWithLatest,
        enableReadOnly: enableReadOnly,
    };
};
exports.deriveToggledFeatures = deriveToggledFeatures;
var isReadOnly = function (context) { return (0, exports.deriveToggledFeatures)(context).enableReadOnly; };
exports.machine = (0, xstate_1.setup)({
    types: {
        context: {},
        input: {},
        children: {},
        events: {},
        emitted: {},
    },
    actors: {
        hotkeyActorLogic: hotkeyActor_1.hotkeyActorLogic,
        overlaysActorLogic: overlaysActor_1.overlaysActorLogic,
        searchActorLogic: searchActor_1.searchActorLogic,
        mediaPrintActorLogic: mediaPrintActor_1.mediaPrintActorLogic,
        editorActor: editorActor_states_1.editorActorLogic,
    },
    guards: {
        'isReady': function (_a) {
            var context = _a.context;
            return context.initialized.xydata && context.initialized.xyflow;
        },
        'enabled: Editor': function (_a) {
            var context = _a.context;
            return context.features.enableEditor;
        },
        'enabled: FitView': function (_a) {
            var context = _a.context;
            return context.features.enableFitView;
        },
        'enabled: FocusMode': function (_a) {
            var context = _a.context;
            return context.features.enableFocusMode && isReadOnly(context);
        },
        'enabled: Readonly': function (_a) {
            var context = _a.context;
            return isReadOnly(context);
        },
        'enabled: RelationshipDetails': function (_a) {
            var context = _a.context;
            return context.features.enableRelationshipDetails;
        },
        'enabled: Search': function (_a) {
            var context = _a.context;
            return context.features.enableSearch;
        },
        'enabled: ElementDetails': function (_a) {
            var context = _a.context;
            return context.features.enableElementDetails;
        },
        'enabled: OpenSource': function (_a) {
            var context = _a.context;
            return context.features.enableVscode;
        },
        'enabled: DynamicViewWalkthrough': function (_a) {
            var context = _a.context;
            return context.features.enableDynamicViewWalkthrough;
        },
        'focus.node: autoUnfocus': function (_a) {
            var event = _a.event;
            (0, xstate_1.assertEvent)(event, 'focus.node');
            return event.autoUnfocus === true;
        },
        'enabled: Overlays': function (_a) {
            var context = _a.context;
            return context.features.enableElementDetails ||
                context.features.enableRelationshipBrowser ||
                context.features.enableRelationshipDetails;
        },
        'not readonly': function (_a) {
            var context = _a.context;
            return !isReadOnly(context);
        },
        'is dynamic view': function (_a) {
            var context = _a.context;
            return context.view._type === 'dynamic';
        },
        'is same view': function (_a) {
            var context = _a.context, event = _a.event;
            (0, xstate_1.assertEvent)(event, ['update.view', 'navigate.to']);
            if (event.type === 'update.view') {
                return context.view.id === event.view.id;
            }
            if (event.type === 'navigate.to') {
                return context.view.id === event.viewId;
            }
            (0, core_1.nonexhaustive)(event.type);
        },
        'is another view': function (_a) {
            var context = _a.context, event = _a.event;
            (0, xstate_1.assertEvent)(event, ['update.view', 'navigate.to']);
            if (event.type === 'update.view') {
                return context.view.id !== event.view.id;
            }
            if (event.type === 'navigate.to') {
                return context.view.id !== event.viewId;
            }
            (0, core_1.nonexhaustive)(event.type);
        },
        'click: node has modelFqn': function (_a) {
            var event = _a.event;
            (0, xstate_1.assertEvent)(event, 'xyflow.nodeClick');
            return 'modelFqn' in event.node.data;
        },
        'click: selected node': function (_a) {
            var event = _a.event;
            (0, xstate_1.assertEvent)(event, 'xyflow.nodeClick');
            return event.node.selected === true;
        },
        'click: same node': function (_a) {
            var _b;
            var context = _a.context, event = _a.event;
            (0, xstate_1.assertEvent)(event, 'xyflow.nodeClick');
            return ((_b = context.lastClickedNode) === null || _b === void 0 ? void 0 : _b.id) === event.node.id;
        },
        'click: focused node': function (_a) {
            var context = _a.context, event = _a.event;
            (0, xstate_1.assertEvent)(event, 'xyflow.nodeClick');
            return context.focusedNode === event.node.id;
        },
        'click: node has connections': function (_a) {
            var context = _a.context, event = _a.event;
            (0, xstate_1.assertEvent)(event, 'xyflow.nodeClick');
            return context.xyedges.some(function (e) { return e.source === event.node.id || e.target === event.node.id; });
        },
        'click: selected edge': function (_a) {
            var event = _a.event;
            (0, xstate_1.assertEvent)(event, ['xyflow.edgeClick', 'xyflow.edgeDoubleClick']);
            return event.edge.selected === true || event.edge.data.active === true;
        },
        'click: active walkthrough step': function (_a) {
            var context = _a.context, event = _a.event;
            (0, xstate_1.assertEvent)(event, ['xyflow.edgeClick', 'xyflow.edgeDoubleClick']);
            if (!context.activeWalkthrough) {
                return false;
            }
            var stepId = context.activeWalkthrough.stepId;
            return event.edge.id === stepId;
        },
    },
});
exports.targetState = {
    idle: '#idle',
    focused: '#focused',
    walkthrough: '#walkthrough',
    printing: '#printing',
    navigating: '#navigating',
};
exports.to = (0, remeda_1.mapValues)(exports.targetState, function (id) { return ({ target: id }); });
