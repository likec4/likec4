"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useXYFlow = useXYFlow;
exports.useXYStore = useXYStore;
exports.useXYStoreApi = useXYStoreApi;
exports.useXYInternalNode = useXYInternalNode;
exports.useCurrentZoom = useCurrentZoom;
exports.useCurrentZoomAtLeast = useCurrentZoomAtLeast;
exports.useIsZoomTooSmall = useIsZoomTooSmall;
var react_1 = require("@xyflow/react");
var fast_equals_1 = require("fast-equals");
var react_2 = require("react");
var useCallbackRef_1 = require("./useCallbackRef");
function useXYFlow() {
    return (0, react_1.useReactFlow)();
}
function useXYStore(selector, equalityFn) {
    return (0, react_1.useStore)((0, useCallbackRef_1.useCallbackRef)(selector), equalityFn !== null && equalityFn !== void 0 ? equalityFn : fast_equals_1.shallowEqual);
}
function useXYStoreApi() {
    return (0, react_1.useStoreApi)();
}
function useXYInternalNode(id) {
    return (0, react_1.useInternalNode)(id);
}
/**
 * Returns the current zoom level of the flow.
 * @param precision The number of decimal places to round to, defaults to 2 (i.e. 1.23)
 * @returns The current zoom level of the flow.
 */
function useCurrentZoom(precision) {
    if (precision === void 0) { precision = 2; }
    return (0, react_1.useStore)((0, react_2.useCallback)(function (state) { return Math.round(state.transform[2] * Math.pow(10, precision)) / Math.pow(10, precision); }, [precision]));
}
function useCurrentZoomAtLeast(minZoom) {
    return (0, react_1.useStore)((0, react_2.useCallback)(function (state) { return state.transform[2] >= minZoom; }, [minZoom]));
}
var selectZoom = function (state) { return state.transform[2] < 0.2; };
function useIsZoomTooSmall() {
    return (0, react_1.useStore)(selectZoom);
}
