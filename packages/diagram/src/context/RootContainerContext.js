"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.usePanningAtom = exports.PanningAtomSafeCtx = exports.ReduceGraphicsModeProvider = exports.RootContainerContextProvider = void 0;
exports.useRootContainerContext = useRootContainerContext;
exports.useRootContainer = useRootContainer;
exports.useRootContainerRef = useRootContainerRef;
exports.useRootContainerElement = useRootContainerElement;
exports.useIsReducedGraphics = useIsReducedGraphics;
exports.useIsPanning = useIsPanning;
var core_1 = require("@mantine/core");
var react_1 = require("@nanostores/react");
var react_2 = require("react");
var RootContainerContext = (0, react_2.createContext)(null);
exports.RootContainerContextProvider = RootContainerContext.Provider;
function useRootContainerContext() {
    return (0, react_2.useContext)(RootContainerContext);
}
function useRootContainer() {
    var ctx = useRootContainerContext();
    if (!ctx) {
        throw new Error('useRootContainer must be used within a RootContainer');
    }
    return ctx;
}
function useRootContainerRef() {
    return useRootContainer().ref;
}
function useRootContainerElement() {
    return useRootContainer().ref.current;
}
var ReduceGraphicsModeCtx = (0, react_2.createContext)(null);
exports.ReduceGraphicsModeProvider = ReduceGraphicsModeCtx.Provider;
/**
 * Hook to determine if reduced graphics mode is enabled.
 */
function useIsReducedGraphics() {
    var isReduced = (0, react_2.useContext)(ReduceGraphicsModeCtx);
    if (isReduced === null) {
        console.warn('ReduceGraphicsMode is not provided');
    }
    return isReduced !== null && isReduced !== void 0 ? isReduced : false;
}
exports.PanningAtomSafeCtx = (_a = (0, core_1.createSafeContext)('PanningAtomSafeCtx is not provided'), _a[0]), exports.usePanningAtom = _a[1];
function useIsPanning() {
    return (0, react_1.useStore)((0, exports.usePanningAtom)());
}
