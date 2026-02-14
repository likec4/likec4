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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LikeC4AdHocViewEditor = LikeC4AdHocViewEditor;
var react_1 = require("@xyflow/react");
var react_2 = require("react");
var remeda_1 = require("remeda");
var const_1 = require("../base/const");
var RootContainer_1 = require("../components/RootContainer");
var DiagramFeatures_1 = require("../context/DiagramFeatures");
var EnsureMantine_1 = require("../context/EnsureMantine");
var FramerMotionConfig_1 = require("../context/FramerMotionConfig");
var IconRenderer_1 = require("../context/IconRenderer");
var TagStylesContext_1 = require("../context/TagStylesContext");
var hooks_1 = require("../hooks");
var useId_1 = require("../hooks/useId");
var DiagramXYFlow_1 = require("../likec4diagram/DiagramXYFlow");
var DiagramActorProvider_1 = require("../likec4diagram/state/DiagramActorProvider");
var LikeC4Styles_1 = require("../LikeC4Styles");
var EditorPanel_1 = require("./EditorPanel");
var hooks_2 = require("./hooks");
var ActorProvider_1 = require("./state/ActorProvider");
var noop = function () { };
var defaultFeatures = __assign(__assign({}, (0, remeda_1.mapValues)(DiagramFeatures_1.DefaultFeatures, function () { return false; })), { enableFitView: true, enableReadOnly: true });
function LikeC4AdHocViewEditor(_a) {
    var service = _a.service;
    var id = (0, useId_1.useId)();
    var initialRef = (0, react_2.useRef)({
        fitView: true,
        defaultNodes: [],
        defaultEdges: [],
    });
    return (<EnsureMantine_1.EnsureMantine>
      <FramerMotionConfig_1.FramerMotionConfig>
        <react_2.Profiler id="LikeC4AdHocViewEditor" onRender={noop}>
          <IconRenderer_1.IconRendererProvider value={null}>
            <ActorProvider_1.AdhocEditorActorProvider service={service}>
              <DiagramFeatures_1.DiagramFeatures features={defaultFeatures}>
                <LikeC4Styles_1.LikeC4Styles id={id}/>
                <TagStylesContext_1.TagStylesProvider rootSelector={"#".concat(id)}>
                  <RootContainer_1.RootContainer id={id}>
                    <react_1.ReactFlowProvider {...initialRef.current}>
                      <LikeC4AdHocView id={id}/>
                      {/* <EditorNavigationPanel /> */}
                      {/* <SelectElementOverlay /> */}
                      <EditorPanel_1.EditorPanel />
                    </react_1.ReactFlowProvider>
                  </RootContainer_1.RootContainer>
                </TagStylesContext_1.TagStylesProvider>
              </DiagramFeatures_1.DiagramFeatures>
            </ActorProvider_1.AdhocEditorActorProvider>
          </IconRenderer_1.IconRendererProvider>
        </react_2.Profiler>
      </FramerMotionConfig_1.FramerMotionConfig>
    </EnsureMantine_1.EnsureMantine>);
}
// interface LikeC4AdHocViewProps {
//   view: LayoutedElementView
// }
var LikeC4AdHocView = (0, react_2.memo)(function (_a) {
    var id = _a.id;
    var view = (0, hooks_2.useAdhocView)();
    return (<DiagramActorProvider_1.DiagramActorProvider id={id} view={view} zoomable pannable fitViewPadding={const_1.FitViewPaddings.withControls} nodesDraggable={false} nodesSelectable>
      <DiagramXYFlow_1.LikeC4DiagramXYFlow />
      <LikeC4AdHocEditorEvents />
    </DiagramActorProvider_1.DiagramActorProvider>);
});
var LikeC4AdHocEditorEvents = (0, react_2.memo)(function () {
    var actorRef = (0, hooks_2.useAdhocEditorActor)();
    var diagram = (0, hooks_1.useDiagram)();
    (0, react_2.useEffect)(function () {
        var subscription = actorRef.on('click.element', function (_a) {
            var id = _a.id;
            diagram.focusOnElement(id);
        });
        return function () { return subscription.unsubscribe(); };
    }, [actorRef, diagram]);
    return null;
});
