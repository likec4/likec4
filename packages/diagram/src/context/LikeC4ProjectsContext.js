"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LikeC4ProjectsContextProvider = void 0;
exports.useOptionalProjectsContext = useOptionalProjectsContext;
var react_1 = require("react");
var LikeC4ProjectsContext = (0, react_1.createContext)(null);
exports.LikeC4ProjectsContextProvider = LikeC4ProjectsContext.Provider;
function useOptionalProjectsContext() {
    return (0, react_1.useContext)(LikeC4ProjectsContext);
}
