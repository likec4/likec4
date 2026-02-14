"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElementActions = void 0;
var icons_react_1 = require("@tabler/icons-react");
var base_primitives_1 = require("../../../base-primitives");
var DiagramFeatures_1 = require("../../../context/DiagramFeatures");
var useCurrentView_1 = require("../../../hooks/useCurrentView");
var useDiagram_1 = require("../../../hooks/useDiagram");
var ElementActions = function (props) {
    var _a = (0, DiagramFeatures_1.useEnabledFeatures)(), enableNavigateTo = _a.enableNavigateTo, enableVscode = _a.enableVscode;
    var diagram = (0, useDiagram_1.useDiagram)();
    var currentViewId = (0, useCurrentView_1.useCurrentViewId)();
    var buttons = [];
    var _b = props.data, navigateTo = _b.navigateTo, fqn = _b.fqn;
    if (navigateTo && enableNavigateTo && currentViewId !== navigateTo) {
        buttons.push({
            key: 'navigate',
            icon: <icons_react_1.IconZoomScan />,
            onClick: function (e) {
                e.stopPropagation();
                diagram.navigateTo(navigateTo);
            },
        });
    }
    if (fqn) {
        buttons.push({
            key: 'relationships',
            icon: <icons_react_1.IconTransform />,
            onClick: function (e) {
                e.stopPropagation();
                diagram.openRelationshipsBrowser(fqn);
            },
        });
    }
    if (fqn && enableVscode) {
        buttons.push({
            key: 'goToSource',
            icon: <icons_react_1.IconFileSymlink />,
            onClick: function (e) {
                e.stopPropagation();
                diagram.openSource({ element: fqn });
            },
        });
    }
    return (<base_primitives_1.ElementActionButtons buttons={buttons} {...props}/>);
};
exports.ElementActions = ElementActions;
