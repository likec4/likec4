"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectsOverviewActorContextProvider = void 0;
exports.useProjectsOverviewActor = useProjectsOverviewActor;
var core_1 = require("@likec4/core");
var react_1 = require("react");
var ProjectsOverviewActorContext = (0, react_1.createContext)(null);
exports.ProjectsOverviewActorContextProvider = ProjectsOverviewActorContext.Provider;
function useProjectsOverviewActor() {
    return (0, core_1.nonNullable)((0, react_1.useContext)(ProjectsOverviewActorContext), 'No ProjectsOverviewActorContext');
}
