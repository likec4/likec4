"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useDiagramCompareLayout = useDiagramCompareLayout;
var core_1 = require("@likec4/core");
var react_1 = require("@xstate/react");
var fast_equals_1 = require("fast-equals");
var machine_setup_1 = require("../likec4diagram/state/machine.setup");
var safeContext_1 = require("./safeContext");
var useCallbackRef_1 = require("./useCallbackRef");
var selectCompareLayoutState = function (_a) {
    var _b, _c, _d;
    var context = _a.context;
    var drifts = (_b = context.view.drifts) !== null && _b !== void 0 ? _b : null;
    if (!context.features.enableCompareWithLatest || !drifts || drifts.length === 0) {
        return ({
            hasEditor: false,
            isEnabled: false,
            isEditable: false,
            isActive: false,
            drifts: null,
            canApplyLatest: false,
            layout: (_c = context.view._layout) !== null && _c !== void 0 ? _c : 'auto',
        });
    }
    var _e = (0, machine_setup_1.deriveToggledFeatures)(context), enableCompareWithLatest = _e.enableCompareWithLatest, enableReadOnly = _e.enableReadOnly;
    return ({
        hasEditor: context.features.enableEditor,
        isEnabled: true,
        isEditable: !enableReadOnly,
        isActive: enableCompareWithLatest === true,
        drifts: drifts,
        canApplyLatest: !drifts.includes('type-changed'),
        layout: (_d = context.view._layout) !== null && _d !== void 0 ? _d : 'auto',
    });
};
function useDiagramCompareLayout() {
    var actorRef = (0, safeContext_1.useDiagramActorRef)();
    var state = (0, react_1.useSelector)(actorRef, selectCompareLayoutState, fast_equals_1.shallowEqual);
    var switchLayout = (0, useCallbackRef_1.useCallbackRef)(function (layoutType) {
        if (!state.isEnabled) {
            console.warn('Compare with latest feature is not enabled');
            return;
        }
        actorRef.send({ type: 'emit.onLayoutTypeChange', layoutType: layoutType });
    });
    var toggleCompare = (0, useCallbackRef_1.useCallbackRef)(function (force) {
        if (!state.isEnabled) {
            console.warn('Compare with latest feature is not enabled');
            return;
        }
        var nextIsActive = force ? (force === 'on') : !state.isActive;
        // Ensure that when disabling compare while in auto layout,
        // we switch back to manual layout
        if (state.isActive && !nextIsActive && state.layout === 'auto') {
            switchLayout('manual');
        }
        actorRef.send({
            type: 'toggle.feature',
            feature: 'CompareWithLatest',
            forceValue: nextIsActive,
        });
    });
    var resetManualLayout = (0, useCallbackRef_1.useCallbackRef)(function () {
        if (!state.isEnabled) {
            console.warn('Compare with latest feature is not enabled');
            return;
        }
        actorRef.send({ type: 'layout.resetManualLayout' });
    });
    var applyLatestToManual = (0, useCallbackRef_1.useCallbackRef)(function () {
        var _a;
        if (!state.isEnabled) {
            console.warn('Compare with latest feature is not enabled');
            return;
        }
        var editor = (0, core_1.nonNullable)((_a = actorRef.system) === null || _a === void 0 ? void 0 : _a.get('editor'), 'editor actor not found');
        editor.send({ type: 'applyLatestToManual' });
        if (state.isActive) {
            actorRef.send({
                type: 'toggle.feature',
                feature: 'CompareWithLatest',
                forceValue: false,
            });
        }
    });
    return [state, { toggleCompare: toggleCompare, switchLayout: switchLayout, resetManualLayout: resetManualLayout, applyLatestToManual: applyLatestToManual }];
}
