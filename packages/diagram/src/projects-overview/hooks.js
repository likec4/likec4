"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useProjectsOverviewState = useProjectsOverviewState;
exports.useProjectsOverviewXYFlow = useProjectsOverviewXYFlow;
exports.useProjectsOverviewXYStoreApi = useProjectsOverviewXYStoreApi;
var react_1 = require("@xstate/react");
var react_2 = require("@xyflow/react");
var fast_equals_1 = require("fast-equals");
var context_1 = require("./context");
function useProjectsOverviewState(selector, compare) {
    if (compare === void 0) { compare = fast_equals_1.shallowEqual; }
    var actor = (0, context_1.useProjectsOverviewActor)();
    return (0, react_1.useSelector)(actor, selector, compare);
}
function useProjectsOverviewXYFlow() {
    return (0, react_2.useReactFlow)();
}
function useProjectsOverviewXYStoreApi() {
    return (0, react_2.useStoreApi)();
}
