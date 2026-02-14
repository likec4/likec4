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
exports.ProjectsOverview = ProjectsOverview;
var web_1 = require("@react-hookz/web");
var react_1 = require("@xstate/react");
var react_2 = require("@xyflow/react");
var react_3 = require("motion/react");
var react_4 = require("react");
var actor_1 = require("./actor");
var context_1 = require("./context");
var ProjectsOverviewPanel_1 = require("./panel/ProjectsOverviewPanel");
var ProjectsOverviewXY_1 = require("./ProjectsOverviewXY");
function ProjectsOverview(_a) {
    var view = _a.view, onNavigateToProject = _a.onNavigateToProject, _b = _a.fitViewPadding, fitViewPadding = _b === void 0 ? {
        top: '50px',
        bottom: '32px',
        left: '32px',
        right: '32px',
    } : _b, props = __rest(_a, ["view", "onNavigateToProject", "fitViewPadding"]);
    var actorRef = (0, react_1.useActorRef)(actor_1.projectOverviewLogic, {
        input: { view: view, fitViewPadding: fitViewPadding },
    });
    (0, react_4.useEffect)(function () {
        actorRef.send({ type: 'update.view', view: view });
    }, [actorRef, view]);
    var onNavigateToProjectRef = (0, web_1.useSyncedRef)(onNavigateToProject);
    (0, react_4.useEffect)(function () {
        var subs = [
            actorRef.on('navigate.to', function (_a) {
                var _b;
                var projectId = _a.projectId;
                (_b = onNavigateToProjectRef.current) === null || _b === void 0 ? void 0 : _b.call(onNavigateToProjectRef, projectId);
            }),
        ];
        return function () {
            subs.forEach(function (sub) { return sub.unsubscribe(); });
        };
    }, [actorRef]);
    var bounds = view.bounds;
    var initialRef = (0, react_4.useRef)({
        initialNodes: [],
        initialEdges: [],
        initialWidth: bounds.width,
        initialHeight: bounds.height,
        fitView: false,
    });
    return (<context_1.ProjectsOverviewActorContextProvider value={actorRef}>
      <react_2.ReactFlowProvider {...initialRef.current}>
        <react_3.LayoutGroup id={actorRef.sessionId} inherit={false}>
          <ProjectsOverviewXY_1.ProjectsOverviewXY {...props}/>
        </react_3.LayoutGroup>
        <ProjectsOverviewPanel_1.ProjectsOverviewPanel />
      </react_2.ReactFlowProvider>
    </context_1.ProjectsOverviewActorContextProvider>);
}
