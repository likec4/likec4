"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenSource = void 0;
var icons_react_1 = require("@tabler/icons-react");
var DiagramEventHandlers_1 = require("../../context/DiagramEventHandlers");
var DiagramFeatures_1 = require("../../context/DiagramFeatures");
var useCurrentView_1 = require("../../hooks/useCurrentView");
var _common_1 = require("../_common");
var OpenSource = function () {
    var viewId = (0, useCurrentView_1.useCurrentViewId)();
    var enableVscode = (0, DiagramFeatures_1.useEnabledFeatures)().enableVscode;
    var onOpenSource = (0, DiagramEventHandlers_1.useDiagramEventHandlers)().onOpenSource;
    if (!enableVscode) {
        return null;
    }
    return (<_common_1.Tooltip label="Open View Source">
      <_common_1.PanelActionIcon 
    // variant="filled"
    onClick={function (e) {
            e.stopPropagation();
            onOpenSource === null || onOpenSource === void 0 ? void 0 : onOpenSource({ view: viewId });
        }} children={<icons_react_1.IconFileSymlink style={{ width: '60%', height: '60%' }}/>}/>
    </_common_1.Tooltip>);
};
exports.OpenSource = OpenSource;
