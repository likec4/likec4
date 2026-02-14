"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useNavigationActorRef = exports.NavigationPanelActorContextProvider = void 0;
exports.useNavigationActorSnapshot = useNavigationActorSnapshot;
exports.useNavigationActorContext = useNavigationActorContext;
exports.useNavigationActor = useNavigationActor;
var react_1 = require("@xstate/react");
var fast_equals_1 = require("fast-equals");
var react_2 = require("react");
var NavigationPanelActorSafeContext = (0, react_2.createContext)(null);
NavigationPanelActorSafeContext.displayName = 'NavigationPanelActorSafeContext';
exports.NavigationPanelActorContextProvider = NavigationPanelActorSafeContext.Provider;
var useNavigationActorRef = function () {
    var ctx = (0, react_2.useContext)(NavigationPanelActorSafeContext);
    if (ctx === null) {
        throw new Error('NavigationPanelActorRef is not found in the context');
    }
    return ctx;
};
exports.useNavigationActorRef = useNavigationActorRef;
function useNavigationActorSnapshot(selector, compare) {
    if (compare === void 0) { compare = fast_equals_1.shallowEqual; }
    var actorRef = (0, exports.useNavigationActorRef)();
    return (0, react_1.useSelector)(actorRef, selector, compare);
}
function useNavigationActorContext(selector, compare) {
    if (compare === void 0) { compare = fast_equals_1.shallowEqual; }
    return useNavigationActorSnapshot(function (snapshot) { return selector(snapshot.context); }, compare);
}
function useNavigationActor() {
    var actorRef = (0, exports.useNavigationActorRef)();
    return (0, react_2.useMemo)(function () { return ({
        actorRef: actorRef,
        send: function (event) { return actorRef.send(event); },
        selectFolder: function (folderPath) { return actorRef.send({ type: 'select.folder', folderPath: folderPath }); },
        selectView: function (viewId) { return actorRef.send({ type: 'select.view', viewId: viewId }); },
        isOpened: function () {
            var snapshot = actorRef.getSnapshot();
            return snapshot.hasTag('active');
        },
        clearSearch: function () { return actorRef.send({ type: 'searchQuery.change', value: '' }); },
        closeDropdown: function () { return actorRef.send({ type: 'dropdown.dismiss' }); },
    }); }, [actorRef]);
}
