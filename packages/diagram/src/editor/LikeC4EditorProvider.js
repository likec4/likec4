"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LikeC4EditorProvider = LikeC4EditorProvider;
exports.EnsureEditorContext = EnsureEditorContext;
exports.useOptionalLikeC4Editor = useOptionalLikeC4Editor;
var react_1 = require("react");
var LikeC4EditorReactContext = (0, react_1.createContext)(null);
/**
 * Provider for the LikeC4 Editor.
 * @example
 * ```tsx
 *
 * // Not required to use memo for editor callbacks
 * const editor = createLikeC4Editor({
 *   fetchView: async (viewId, layout) => {
 *     // fetch view logic
 *   },
 *   handleChange: (viewId, change) => {
 *     // handle change logic
 *   }
 * })
 *
 * <LikeC4EditorProvider
 *  editor={editor}>
 *   <App />
 * </LikeC4EditorProvider>
 * ```
 */
function LikeC4EditorProvider(_a) {
    var children = _a.children, editor = _a.editor;
    return <LikeC4EditorReactContext.Provider value={editor}>{children}</LikeC4EditorReactContext.Provider>;
}
/**
 * Component that ensures the editor context is available.
 *
 * @param children - The children to render.
 */
function EnsureEditorContext(_a) {
    var children = _a.children;
    var ctx = (0, react_1.useContext)(LikeC4EditorReactContext);
    if (!ctx) {
        return null;
    }
    return <>{children}</>;
}
function useOptionalLikeC4Editor() {
    return (0, react_1.useContext)(LikeC4EditorReactContext);
}
