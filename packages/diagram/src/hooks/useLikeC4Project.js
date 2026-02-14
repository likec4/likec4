"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useLikeC4ProjectsContext = useLikeC4ProjectsContext;
exports.useLikeC4Projects = useLikeC4Projects;
exports.useChangeLikeC4Project = useChangeLikeC4Project;
exports.useHasProjects = useHasProjects;
exports.useLikeC4ProjectId = useLikeC4ProjectId;
exports.useLikeC4Project = useLikeC4Project;
var LikeC4ModelContext_1 = require("../context/LikeC4ModelContext");
var LikeC4ProjectsContext_1 = require("../context/LikeC4ProjectsContext");
var emptyProjects = [];
function onProjectChange(id) {
    console.warn("Triggered callback to change project to ".concat(id, ", but no <LikeC4ProjectsProvider/> found"));
}
var emptyContext = {
    projects: emptyProjects,
    onProjectChange: onProjectChange,
};
function useLikeC4ProjectsContext() {
    var _a;
    return (_a = (0, LikeC4ProjectsContext_1.useOptionalProjectsContext)()) !== null && _a !== void 0 ? _a : emptyContext;
}
/**
 * @returns The list of available projects, or empty array if no projects are available.
 */
function useLikeC4Projects() {
    return useLikeC4ProjectsContext().projects;
}
/**
 * @returns The callback to change current project, or a no-op if no LikeC4ProjectsProvider is found.
 */
function useChangeLikeC4Project() {
    return useLikeC4ProjectsContext().onProjectChange;
}
/**
 * @returns True if there are more than one project available in the context.
 */
function useHasProjects() {
    var ctx = (0, LikeC4ProjectsContext_1.useOptionalProjectsContext)();
    if (!ctx) {
        return false;
    }
    return ctx.projects.length > 1;
}
/**
 * @returns Current project id, as provided by LikeC4Model
 */
function useLikeC4ProjectId() {
    var ctx = (0, LikeC4ModelContext_1.useOptionalLikeC4Model)();
    if (!ctx) {
        throw new Error('No LikeC4ModelProvider found');
    }
    return ctx.projectId;
}
/**
 * Returns current LikeC4 project.
 * Requires LikeC4ModelProvider in the tree.
 * Falls back to model's project if LikeC4ProjectsProvider is not available.
 */
function useLikeC4Project() {
    var modelCtx = (0, LikeC4ModelContext_1.useOptionalLikeC4Model)();
    var projectsCtx = (0, LikeC4ProjectsContext_1.useOptionalProjectsContext)();
    if (!modelCtx) {
        throw new Error('No LikeC4ModelProvider found');
    }
    var project = projectsCtx === null || projectsCtx === void 0 ? void 0 : projectsCtx.projects.find(function (p) { return p.id === modelCtx.projectId; });
    return project !== null && project !== void 0 ? project : modelCtx.project;
}
