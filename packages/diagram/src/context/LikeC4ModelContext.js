"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentViewModelContext = exports.LikeC4ModelContextProvider = void 0;
exports.EnsureCurrentViewModel = EnsureCurrentViewModel;
exports.useOptionalLikeC4Model = useOptionalLikeC4Model;
exports.useOptionalCurrentViewModel = useOptionalCurrentViewModel;
var react_1 = require("react");
var LikeC4ModelContext = (0, react_1.createContext)(null);
exports.LikeC4ModelContextProvider = LikeC4ModelContext.Provider;
var CurrentViewModelCtx = (0, react_1.createContext)(null);
exports.CurrentViewModelContext = CurrentViewModelCtx.Provider;
function EnsureCurrentViewModel(_a) {
    var children = _a.children;
    var viewmodel = (0, react_1.useContext)(CurrentViewModelCtx);
    if (!viewmodel) {
        return null;
    }
    return <>{children}</>;
}
/**
 * @returns The LikeC4Model from context, or null if no LikeC4ModelProvider is found.
 */
function useOptionalLikeC4Model() {
    return (0, react_1.useContext)(LikeC4ModelContext);
}
function useOptionalCurrentViewModel() {
    return (0, react_1.useContext)(CurrentViewModelCtx);
}
