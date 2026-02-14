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
exports.EditorPanelStoreProvider = void 0;
exports.selectEditorPanelState = selectEditorPanelState;
exports.useEditorPanelStore = useEditorPanelStore;
exports.useEditorPanelState = useEditorPanelState;
exports.useOnEditorPanelEvent = useOnEditorPanelEvent;
exports.useEditorPanelTrigger = useEditorPanelTrigger;
var store_1 = require("@xstate/store");
var react_1 = require("@xstate/store/react");
var react_2 = require("react");
var remeda_1 = require("remeda");
var hooks_1 = require("../../hooks");
var hooks_2 = require("../hooks");
var useElementsTree_1 = require("../useElementsTree");
var utils_1 = require("./utils");
var createEditorPanelStore = function (_a) {
    var initial = _a.initial, sideEffects = _a.sideEffects;
    return (0, store_1.createStore)({
        context: {
            searchInput: '',
            expandedValue: [],
            collection: initial,
        },
        emits: {
            inputKeyDown: function (payload) {
            },
        },
        on: {
            'inputChange': function (context, event) {
                return __assign(__assign({}, context), { searchInput: event.value });
            },
            'inputKeyDown': function (context, event, enqueue) {
                enqueue.emit.inputKeyDown();
            },
            'modelUpdate': function (context, event) {
                return __assign(__assign({}, context), { collection: event.collection });
            },
            'elementClick': function (context, event, enqueue) {
                var current = context.collection.findNode(event.id);
                var path = context.collection.getIndexPath(event.id);
                if (!current || !path) {
                    return context;
                }
                // const nextState = current.state !== 'include' ? 'include' : 'unknown'
                enqueue.effect(function () {
                    sideEffects.onElementStateClick({ id: event.id });
                });
                return context;
                // // console.log('Changing state of', event.id, 'from', toChange.state, 'to', newState)
                // // //
                // // let newState
                // // switch (toChange.state) {
                // //   case 'unknown':
                // //     newState = 'included' as const
                // //     break
                // //   case 'included':
                // //     newState = 'excluded' as const
                // //     break
                // //   case 'excluded':
                // //     newState = 'unknown' as const
                // //     break
                // // }
                // return {
                //   ...context,
                //   collection: context.collection.replace(path, {
                //     ...current,
                //     state: nextState,
                //   }),
                // }
            },
        },
    });
};
var EditorPanelStoreContext = (0, react_2.createContext)(null);
var EditorPanelStoreProvider = function (props) {
    var likec4model = (0, hooks_1.useLikeC4Model)();
    var likec4modelRef = (0, react_2.useRef)(likec4model);
    likec4modelRef.current = likec4model;
    var actorRef = (0, hooks_2.useAdhocEditorActor)();
    var store = (0, react_2.useMemo)(function () {
        return createEditorPanelStore({
            initial: (0, useElementsTree_1.createTreeCollection)(likec4model),
            sideEffects: {
                onElementStateClick: function (_a) {
                    var id = _a.id;
                    actorRef.send({ type: 'toggle.element', id: id });
                },
            },
        });
    }, [actorRef]);
    (0, hooks_1.useUpdateEffect)(function () {
        store.trigger.modelUpdate({
            collection: (0, useElementsTree_1.createTreeCollection)(likec4model, (0, utils_1.deriveElementStates)(actorRef.getSnapshot().context)),
        });
    }, [likec4model]);
    (0, react_2.useEffect)(function () {
        var subscription = actorRef.on('view.update', function () {
            store.trigger.modelUpdate({
                collection: (0, useElementsTree_1.createTreeCollection)(likec4modelRef.current, (0, utils_1.deriveElementStates)(actorRef.getSnapshot().context)),
            });
        });
        return function () {
            subscription.unsubscribe();
        };
    }, [actorRef]);
    return (<EditorPanelStoreContext.Provider value={store}>
      {props.children}
    </EditorPanelStoreContext.Provider>);
};
exports.EditorPanelStoreProvider = EditorPanelStoreProvider;
function selectEditorPanelState(selector, compare) {
    return [
        function (snapshot) { return selector(snapshot.context); },
        compare !== null && compare !== void 0 ? compare : store_1.shallowEqual,
    ];
}
function useEditorPanelStore() {
    return (0, react_2.useContext)(EditorPanelStoreContext);
}
function useEditorPanelState() {
    var _a, _b, _c;
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var store = useEditorPanelStore();
    var selector, compare;
    if (args.length === 2) {
        ;
        selector = args[0], compare = args[1];
    }
    else if (args.length === 1 && Array.isArray(args[0]) && (0, remeda_1.hasAtLeast)(args[0], 2)) {
        ;
        _a = args[0], selector = _a[0], compare = _a[1];
    }
    else if (args.length === 1 && Array.isArray(args[0]) && (0, remeda_1.hasAtLeast)(args[0], 1)) {
        ;
        _b = [args[0], store_1.shallowEqual], selector = _b[0], compare = _b[1];
    }
    else if (args.length === 1 && typeof args[0] === 'function') {
        ;
        _c = [args[0], store_1.shallowEqual], selector = _c[0], compare = _c[1];
    }
    else {
        throw new Error('Invalid arguments for useEditorPanelState');
    }
    return (0, react_1.useSelector)(store, selector, compare);
}
/**
 * Hook to subscribe to editor panel events
 * @param args - The event name and handler function
 * @example
 * useOnEditorPanelEvent('inputKeyDown', () => {
 *   console.log('Input key down event')
 * })
 */
function useOnEditorPanelEvent() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var store = useEditorPanelStore();
    var event = args[0];
    var handler = (0, hooks_1.useCallbackRef)(args[1]);
    (0, react_2.useEffect)(function () {
        var subscription = store.on(event, handler);
        return function () {
            subscription.unsubscribe();
        };
    }, [event, store]);
}
function useEditorPanelTrigger() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var store = useEditorPanelStore();
    if (args.length === 0) {
        return store.trigger;
    }
    var trigger = args[0];
    return (0, hooks_1.useCallbackRef)(function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        trigger.apply(void 0, __spreadArray([store.trigger], args, true));
    });
}
