"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LikeC4ProjectsOverview = LikeC4ProjectsOverview;
var RootContainer_1 = require("./components/RootContainer");
var context_1 = require("./context");
var useId_1 = require("./hooks/useId");
var useLikeC4Project_1 = require("./hooks/useLikeC4Project");
var LikeC4Styles_1 = require("./LikeC4Styles");
var projects_overview_1 = require("./projects-overview");
function LikeC4ProjectsOverview(_a) {
    var view = _a.view, className = _a.className, onNavigateToProject = _a.onNavigateToProject, props = __rest(_a, ["view", "className", "onNavigateToProject"]);
    var onChangeLikeC4Project = (0, useLikeC4Project_1.useChangeLikeC4Project)();
    var id = (0, useId_1.useId)();
    // If no onSelectProject is provided, try from the context
    onNavigateToProject !== null && onNavigateToProject !== void 0 ? onNavigateToProject : (onNavigateToProject = onChangeLikeC4Project);
    return (<context_1.EnsureMantine>
      <context_1.FramerMotionConfig>
        <LikeC4Styles_1.LikeC4Styles id={id}/>
        <RootContainer_1.RootContainer id={id} className={className}>
          <projects_overview_1.ProjectsOverview view={view} onNavigateToProject={onNavigateToProject} {...props}/>
        </RootContainer_1.RootContainer>
      </context_1.FramerMotionConfig>
    </context_1.EnsureMantine>);
}
