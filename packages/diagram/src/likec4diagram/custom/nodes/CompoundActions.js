"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompoundActions = void 0;
var base_primitives_1 = require("../../../base-primitives");
var DiagramFeatures_1 = require("../../../context/DiagramFeatures");
var useDiagram_1 = require("../../../hooks/useDiagram");
var CompoundActions = function (props) {
    var enableNavigateTo = (0, DiagramFeatures_1.useEnabledFeatures)().enableNavigateTo;
    var diagram = (0, useDiagram_1.useDiagram)();
    var navigateTo = props.data.navigateTo;
    if (navigateTo && enableNavigateTo) {
        return (<base_primitives_1.CompoundActionButton onClick={function (e) {
                e.stopPropagation();
                diagram.navigateTo(navigateTo, props.id);
            }} {...props}/>);
    }
    return null;
};
exports.CompoundActions = CompoundActions;
