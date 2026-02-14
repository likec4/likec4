"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useCurrentViewId = useCurrentViewId;
exports.useCurrentView = useCurrentView;
var useDiagram_1 = require("./useDiagram");
var selectViewId = (0, useDiagram_1.selectDiagramActor)(function (s) { return s.context.view.id; });
/**
 * Returns current view id
 * Should be used only inside LikeC4Diagram
 */
function useCurrentViewId() {
    return (0, useDiagram_1.useDiagramSnapshot)(selectViewId);
}
var selectView = (0, useDiagram_1.selectDiagramActor)(function (s) { return s.context.view; });
/**
 * Returns current view
 * Should be used only inside LikeC4Diagram
 */
function useCurrentView() {
    return (0, useDiagram_1.useDiagramSnapshot)(selectView);
}
