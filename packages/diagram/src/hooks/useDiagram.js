"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useDiagramActorRef = exports.useDiagram = void 0;
exports.selectDiagramActor = selectDiagramActor;
exports.useDiagramSnapshot = useDiagramSnapshot;
exports.selectDiagramActorContext = selectDiagramActorContext;
exports.useDiagramContext = useDiagramContext;
exports.useOnDiagramEvent = useOnDiagramEvent;
var react_1 = require("@xstate/react");
var fast_equals_1 = require("fast-equals");
var react_2 = require("react");
var safeContext_1 = require("./safeContext");
Object.defineProperty(exports, "useDiagram", { enumerable: true, get: function () { return safeContext_1.useDiagram; } });
Object.defineProperty(exports, "useDiagramActorRef", { enumerable: true, get: function () { return safeContext_1.useDiagramActorRef; } });
var useCallbackRef_1 = require("./useCallbackRef");
/**
 * Helper to create a selector for diagram actor snapshot
 */
function selectDiagramActor(selector) {
    return selector;
}
function useDiagramSnapshot(selector, compare) {
    if (compare === void 0) { compare = fast_equals_1.shallowEqual; }
    var actorRef = (0, safeContext_1.useDiagramActorRef)();
    return (0, react_1.useSelector)(actorRef, selector, compare);
}
/**
 * Helper to create a selector for diagram actor snapshot
 */
function selectDiagramActorContext(selector) {
    return function (state) { return selector(state.context); };
}
/**
 * Read diagram context
 */
function useDiagramContext(selector, compare, deps) {
    if (compare === void 0) { compare = fast_equals_1.shallowEqual; }
    if (deps === void 0) { deps = []; }
    var actorRef = (0, safeContext_1.useDiagramActorRef)();
    var selectorRef = (0, useCallbackRef_1.useCallbackRef)(selector);
    var select = (0, react_2.useCallback)(function (s) { return selectorRef(s.context); }, deps);
    return (0, react_1.useSelector)(actorRef, select, compare);
}
/**
 * Subscribe to diagram emitted events
 * @example
 * ```tsx
 * useOnDiagramEvent('navigateTo', ({viewId}) => {
 *   console.log('Navigating to view', viewId)
 * })
 * ```
 */
function useOnDiagramEvent(event, callback, options) {
    var _a;
    var actorRef = (0, safeContext_1.useDiagramActorRef)();
    var callbackRef = (0, useCallbackRef_1.useCallbackRef)(callback);
    var wasCalled = (0, react_2.useRef)(false);
    var once = (_a = options === null || options === void 0 ? void 0 : options.once) !== null && _a !== void 0 ? _a : false;
    (0, react_2.useEffect)(function () {
        if (once && wasCalled.current) {
            return;
        }
        var subscription = actorRef.on(event, function (payload) {
            callbackRef(payload);
            wasCalled.current = true;
            if (once) {
                subscription === null || subscription === void 0 ? void 0 : subscription.unsubscribe();
                subscription = null;
            }
        });
        return function () {
            subscription === null || subscription === void 0 ? void 0 : subscription.unsubscribe();
        };
    }, [actorRef, event, once]);
}
