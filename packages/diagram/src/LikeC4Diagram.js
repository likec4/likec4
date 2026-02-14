"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LikeC4Diagram = LikeC4Diagram;
var web_1 = require("@react-hookz/web");
var react_1 = require("@xyflow/react");
var fast_equals_1 = require("fast-equals");
var react_2 = require("react");
var remeda_1 = require("remeda");
var base_1 = require("./base");
var RootContainer_1 = require("./components/RootContainer");
var context_1 = require("./context");
var CurrentViewModelProvider_1 = require("./context/CurrentViewModelProvider");
var TagStylesContext_1 = require("./context/TagStylesContext");
var editor_1 = require("./editor");
var useId_1 = require("./hooks/useId");
var useLikeC4Model_1 = require("./hooks/useLikeC4Model");
var DiagramUI_1 = require("./likec4diagram/DiagramUI");
var DiagramXYFlow_1 = require("./likec4diagram/DiagramXYFlow");
var DiagramActorProvider_1 = require("./likec4diagram/state/DiagramActorProvider");
var LikeC4Styles_1 = require("./LikeC4Styles");
var view_bounds_1 = require("./utils/view-bounds");
var noop = function () { };
/**
 * Low-level component to display LikeC4 view
 * Expects CSS to be injected
 *
 * Use {@link ReactLikeC4} or {@link LikeC4View} for ready-to-use component
 */
function LikeC4Diagram(_a) {
    var onCanvasClick = _a.onCanvasClick, onCanvasContextMenu = _a.onCanvasContextMenu, onCanvasDblClick = _a.onCanvasDblClick, onEdgeClick = _a.onEdgeClick, onEdgeContextMenu = _a.onEdgeContextMenu, onNavigateTo = _a.onNavigateTo, onNodeClick = _a.onNodeClick, onNodeContextMenu = _a.onNodeContextMenu, onOpenSource = _a.onOpenSource, onLogoClick = _a.onLogoClick, onLayoutTypeChange = _a.onLayoutTypeChange, onInitialized = _a.onInitialized, view = _a.view, className = _a.className, _b = _a.controls, controls = _b === void 0 ? true : _b, _c = _a.fitView, fitView = _c === void 0 ? true : _c, _d = _a.fitViewPadding, _fitViewPadding = _d === void 0 ? controls ? base_1.FitViewPaddings.withControls : base_1.FitViewPaddings.default : _d, _e = _a.pannable, pannable = _e === void 0 ? true : _e, _f = _a.zoomable, zoomable = _f === void 0 ? true : _f, _g = _a.background, background = _g === void 0 ? 'dots' : _g, _h = _a.enableElementTags, enableElementTags = _h === void 0 ? false : _h, _j = _a.enableFocusMode, enableFocusMode = _j === void 0 ? false : _j, _k = _a.enableElementDetails, enableElementDetails = _k === void 0 ? false : _k, _l = _a.enableRelationshipDetails, enableRelationshipDetails = _l === void 0 ? false : _l, _m = _a.enableRelationshipBrowser, enableRelationshipBrowser = _m === void 0 ? false : _m, _o = _a.enableCompareWithLatest, enableCompareWithLatest = _o === void 0 ? !!onLayoutTypeChange : _o, nodesSelectable = _a.nodesSelectable, _p = _a.enableNotations, enableNotations = _p === void 0 ? false : _p, _q = _a.showNavigationButtons, showNavigationButtons = _q === void 0 ? !!onNavigateTo : _q, _r = _a.enableDynamicViewWalkthrough, enableDynamicViewWalkthrough = _r === void 0 ? false : _r, dynamicViewVariant = _a.dynamicViewVariant, _s = _a.enableSearch, enableSearch = _s === void 0 ? false : _s, _t = _a.enableNotes, enableNotes = _t === void 0 ? true : _t, initialWidth = _a.initialWidth, initialHeight = _a.initialHeight, _u = _a.reduceGraphics, reduceGraphics = _u === void 0 ? 'auto' : _u, renderIcon = _a.renderIcon, where = _a.where, reactFlowProps = _a.reactFlowProps, renderNodes = _a.renderNodes, children = _a.children;
    var id = (0, useId_1.useId)();
    var initialRef = (0, react_2.useRef)(null);
    // Enable compare with latest if there are manual layouts
    var optionalLikeC4Model = (0, useLikeC4Model_1.useOptionalLikeC4Model)();
    enableCompareWithLatest = enableCompareWithLatest &&
        !!onLayoutTypeChange &&
        !!optionalLikeC4Model &&
        !(0, remeda_1.isEmptyish)(optionalLikeC4Model.$data.manualLayouts);
    var hasLikeC4Model = !!optionalLikeC4Model;
    var hasEditor = !!(0, editor_1.useOptionalLikeC4Editor)();
    var readonly = !hasEditor;
    nodesSelectable !== null && nodesSelectable !== void 0 ? nodesSelectable : (nodesSelectable = hasEditor || enableFocusMode || !!onNavigateTo || !!onNodeClick);
    var bounds = (0, view_bounds_1.pickViewBounds)(view, dynamicViewVariant);
    var fitViewPadding = useNormalizedViewPadding(_fitViewPadding);
    if (initialRef.current == null) {
        initialRef.current = {
            defaultEdges: [],
            defaultNodes: [],
            initialWidth: initialWidth !== null && initialWidth !== void 0 ? initialWidth : bounds.width,
            initialHeight: initialHeight !== null && initialHeight !== void 0 ? initialHeight : bounds.height,
            initialFitViewOptions: {
                maxZoom: base_1.MaxZoom,
                minZoom: base_1.MinZoom,
                padding: fitViewPadding,
            },
            initialMaxZoom: base_1.MaxZoom,
            initialMinZoom: base_1.MinZoom,
        };
    }
    var isReducedGraphicsMode = reduceGraphics === 'auto'
        // If view has more then 4000 * 4000 pixels - assume it is a big diagram
        // Enable reduced graphics mode if diagram is "big" and pannable, and has compounds
        ? pannable && ((view.bounds.width * view.bounds.height) > 16000000) &&
            view.nodes.some(function (n) { var _a; return ((_a = n.children) === null || _a === void 0 ? void 0 : _a.length) > 0; })
        : reduceGraphics;
    return (<react_2.Profiler id="LikeC4Diagram" onRender={noop}>
      <context_1.EnsureMantine>
        <context_1.FramerMotionConfig reducedMotion={isReducedGraphicsMode ? 'always' : undefined}>
          <context_1.IconRendererProvider value={renderIcon !== null && renderIcon !== void 0 ? renderIcon : null}>
            <context_1.DiagramFeatures features={{
            enableFitView: fitView,
            enableEditor: hasEditor,
            enableReadOnly: readonly,
            enableFocusMode: enableFocusMode,
            enableNavigateTo: !!onNavigateTo,
            enableElementDetails: enableElementDetails && hasLikeC4Model,
            enableRelationshipDetails: enableRelationshipDetails && hasLikeC4Model,
            enableRelationshipBrowser: enableRelationshipBrowser && hasLikeC4Model,
            enableSearch: enableSearch && hasLikeC4Model,
            enableNavigationButtons: showNavigationButtons && !!onNavigateTo,
            enableDynamicViewWalkthrough: view._type === 'dynamic' && enableDynamicViewWalkthrough,
            enableNotations: enableNotations,
            enableVscode: !!onOpenSource,
            enableControls: controls,
            enableElementTags: enableElementTags,
            enableCompareWithLatest: enableCompareWithLatest,
            enableNotes: enableNotes,
        }}>
              <context_1.DiagramEventHandlers handlers={{
            onCanvasClick: onCanvasClick,
            onCanvasContextMenu: onCanvasContextMenu,
            onCanvasDblClick: onCanvasDblClick,
            onEdgeClick: onEdgeClick,
            onEdgeContextMenu: onEdgeContextMenu,
            onNavigateTo: onNavigateTo,
            onNodeClick: onNodeClick,
            onNodeContextMenu: onNodeContextMenu,
            onOpenSource: onOpenSource,
            onLogoClick: onLogoClick,
            onInitialized: onInitialized,
            onLayoutTypeChange: onLayoutTypeChange,
        }}>
                <LikeC4Styles_1.LikeC4Styles id={id}/>
                <TagStylesContext_1.TagStylesProvider rootSelector={"#".concat(id)}>
                  <RootContainer_1.RootContainer id={id} className={className} reduceGraphics={isReducedGraphicsMode}>
                    <react_1.ReactFlowProvider fitView={fitView} {...initialRef.current}>
                      <DiagramActorProvider_1.DiagramActorProvider id={id} view={view} zoomable={zoomable} pannable={pannable} fitViewPadding={fitViewPadding} nodesDraggable={hasEditor} nodesSelectable={nodesSelectable} where={where !== null && where !== void 0 ? where : null} dynamicViewVariant={dynamicViewVariant}>
                        <CurrentViewModelProvider_1.CurrentViewModelProvider>
                          <DiagramXYFlow_1.LikeC4DiagramXYFlow background={background} reactFlowProps={reactFlowProps} renderNodes={renderNodes}>
                            {children}
                          </DiagramXYFlow_1.LikeC4DiagramXYFlow>
                          <DiagramUI_1.LikeC4DiagramUI />
                        </CurrentViewModelProvider_1.CurrentViewModelProvider>
                      </DiagramActorProvider_1.DiagramActorProvider>
                    </react_1.ReactFlowProvider>
                  </RootContainer_1.RootContainer>
                </TagStylesContext_1.TagStylesProvider>
              </context_1.DiagramEventHandlers>
            </context_1.DiagramFeatures>
          </context_1.IconRendererProvider>
        </context_1.FramerMotionConfig>
      </context_1.EnsureMantine>
    </react_2.Profiler>);
}
var toLiteralPaddingWithUnit = function (value) {
    if (typeof value === 'number') {
        return "".concat(value, "px");
    }
    return value;
};
/**
 * Converts number values to px and keep referential integrity
 */
function useNormalizedViewPadding(raw) {
    return (0, web_1.useCustomCompareMemo)(function () {
        if ((0, remeda_1.isPlainObject)(raw)) {
            return (0, remeda_1.mapValues)(raw, toLiteralPaddingWithUnit);
        }
        var v = toLiteralPaddingWithUnit(raw);
        return {
            x: v,
            y: v,
        };
    }, [raw], fast_equals_1.deepEqual);
}
