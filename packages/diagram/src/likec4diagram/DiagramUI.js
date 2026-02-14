"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LikeC4DiagramUI = void 0;
var web_1 = require("@react-hookz/web");
var react_1 = require("react");
var ErrorFallback_1 = require("../components/ErrorFallback");
var DiagramFeatures_1 = require("../context/DiagramFeatures");
var useOverlaysActor_1 = require("../hooks/useOverlaysActor");
var navigationpanel_1 = require("../navigationpanel");
var Overlays_1 = require("../overlays/Overlays");
var Search_1 = require("../search/Search");
var RelationshipPopover_1 = require("./relationship-popover/RelationshipPopover");
var ui_1 = require("./ui");
exports.LikeC4DiagramUI = (0, react_1.memo)(function () {
    var _a = (0, DiagramFeatures_1.useEnabledFeatures)(), enableControls = _a.enableControls, enableNotations = _a.enableNotations, enableSearch = _a.enableSearch, enableRelationshipDetails = _a.enableRelationshipDetails, enableReadOnly = _a.enableReadOnly, enableCompareWithLatest = _a.enableCompareWithLatest;
    var rerender = (0, web_1.useRerender)();
    var overlaysActorRef = (0, useOverlaysActor_1.useOverlaysActorRef)();
    var handleReset = (0, react_1.useCallback)(function () {
        console.warn('DiagramUI: resetting error boundary and rerendering...');
        rerender();
    }, []);
    return (<ErrorFallback_1.ErrorBoundary onReset={handleReset}>
      {enableControls && <navigationpanel_1.NavigationPanel />}
      {overlaysActorRef && <Overlays_1.Overlays overlaysActorRef={overlaysActorRef}/>}
      {enableNotations && <ui_1.NotationPanel />}
      {enableSearch && <Search_1.Search />}
      {enableRelationshipDetails && enableReadOnly && <RelationshipPopover_1.RelationshipPopover />}
      {enableCompareWithLatest && <ui_1.LayoutDriftFrame />}
    </ErrorFallback_1.ErrorBoundary>);
});
exports.LikeC4DiagramUI.displayName = 'DiagramUI';
