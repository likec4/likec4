"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdhocEditorActorContextProvider = void 0;
exports.useAdhocEditorActor = useAdhocEditorActor;
exports.useAdhocEditor = useAdhocEditor;
exports.useAdhocEditorSnapshot = useAdhocEditorSnapshot;
exports.useAdhocView = useAdhocView;
exports.selectFromSnapshot = selectFromSnapshot;
exports.selectFromContext = selectFromContext;
var core_1 = require("@likec4/core");
var react_1 = require("@xstate/react");
var fast_equals_1 = require("fast-equals");
var react_2 = require("react");
var AdhocEditorActorContext = (0, react_2.createContext)(null);
exports.AdhocEditorActorContextProvider = AdhocEditorActorContext.Provider;
function useAdhocEditorActor() {
    return (0, core_1.nonNullable)((0, react_2.useContext)(AdhocEditorActorContext), 'No AdhocEditorActorContext');
}
function useAdhocEditor() {
    var actorRef = useAdhocEditorActor();
    return (0, react_2.useMemo)(function () { return ({
        open: function () { return actorRef.send({ type: 'select.open' }); },
        close: function () { return actorRef.send({ type: 'select.close' }); },
        toggleRule: function (ruleId) { return actorRef.send({ type: 'toggle.rule', ruleId: ruleId }); },
        // include: (element: ElementModel) => actorRef.send({ type: 'include.element', model: element.id }),
    }); }, [actorRef]);
}
function useAdhocEditorSnapshot(selector, compare) {
    if (compare === void 0) { compare = fast_equals_1.shallowEqual; }
    var actorRef = useAdhocEditorActor();
    return (0, react_1.useSelector)(actorRef, selector, compare);
}
var EMPTY_VIEW = (_a = {
        id: 'adhoc'
    },
    _a['_type'] = 'element',
    _a.autoLayout = { direction: 'LR' },
    _a.nodes = [],
    _a.edges = [],
    _a.bounds = { x: 0, y: 0, width: 0, height: 0 },
    _a['_stage'] = 'layouted',
    _a.title = null,
    _a.description = null,
    _a.hash = '',
    _a);
var selectView = function (_a) {
    var _b;
    var context = _a.context;
    return (_b = context.view) !== null && _b !== void 0 ? _b : EMPTY_VIEW;
};
function useAdhocView() {
    var actorRef = useAdhocEditorActor();
    return (0, react_1.useSelector)(actorRef, selectView);
}
function selectFromSnapshot(selector) {
    return selector;
}
function selectFromContext(selector) {
    return function (state) { return selector(state.context); };
}
