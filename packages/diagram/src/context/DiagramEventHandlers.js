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
exports.DiagramEventHandlers = DiagramEventHandlers;
exports.useDiagramEventHandlers = useDiagramEventHandlers;
exports.useDiagramEventHandlersRef = useDiagramEventHandlersRef;
var web_1 = require("@react-hookz/web");
var react_1 = require("react");
var remeda_1 = require("remeda");
var defaultHandlers = {
    onNavigateTo: null,
    onNodeClick: null,
    onNodeContextMenu: null,
    onCanvasContextMenu: null,
    onEdgeClick: null,
    onEdgeContextMenu: null,
    onCanvasClick: null,
    onCanvasDblClick: null,
    onLogoClick: null,
    onOpenSource: null,
    onInitialized: null,
    onLayoutTypeChange: null,
};
var HandlerNames = (0, remeda_1.keys)(defaultHandlers);
var DiagramEventHandlersRefContext = (0, react_1.createContext)({
    current: defaultHandlers,
});
var DiagramEventHandlersReactContext = (0, react_1.createContext)(__assign(__assign({}, (0, remeda_1.mapToObj)(HandlerNames, function (name) { return [name, null]; })), { handlersRef: {
        current: defaultHandlers,
    } }));
function DiagramEventHandlers(_a) {
    var handlers = _a.handlers, children = _a.children;
    var handlersRef = (0, web_1.useSyncedRef)(handlers);
    var deps = HandlerNames.map(function (name) { return (0, remeda_1.isFunction)(handlers[name]); });
    var value = (0, react_1.useMemo)(function () { return (__assign(__assign({}, (0, remeda_1.mapToObj)(HandlerNames, function (name) {
        if (handlersRef.current[name]) {
            // @ts-expect-error TODO: fix this
            return [name, function () {
                    var _a, _b;
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i] = arguments[_i];
                    }
                    return (_b = (_a = handlersRef.current)[name]) === null || _b === void 0 ? void 0 : _b.call.apply(_b, __spreadArray([_a], args, false));
                }];
        }
        return [name, null];
    })), { handlersRef: handlersRef })); }, __spreadArray([handlersRef], deps, true));
    return (<DiagramEventHandlersRefContext.Provider value={handlersRef}>
      <DiagramEventHandlersReactContext.Provider value={value}>
        {children}
      </DiagramEventHandlersReactContext.Provider>
    </DiagramEventHandlersRefContext.Provider>);
}
function useDiagramEventHandlers() {
    return (0, react_1.useContext)(DiagramEventHandlersReactContext);
}
function useDiagramEventHandlersRef() {
    return (0, react_1.useContext)(DiagramEventHandlersRefContext);
}
