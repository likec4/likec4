"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelationshipEdge = void 0;
var system_1 = require("@xyflow/system");
var base_primitives_1 = require("../../../base-primitives");
var context_1 = require("../../../context");
var useDiagram_1 = require("../../../hooks/useDiagram");
exports.RelationshipEdge = (0, base_primitives_1.memoEdge)(function (props) {
    var enableNavigateTo = (0, context_1.useEnabledFeatures)().enableNavigateTo;
    var navigateTo = props.data.navigateTo;
    var _a = (0, system_1.getBezierPath)(props), svgPath = _a[0], labelX = _a[1], labelY = _a[2];
    var diagram = (0, useDiagram_1.useDiagram)();
    return (<base_primitives_1.EdgeContainer {...props}>
      <base_primitives_1.EdgePath edgeProps={props} svgPath={svgPath}/>
      <base_primitives_1.EdgeLabelContainer edgeProps={props} labelPosition={{
            x: labelX,
            y: labelY,
            translate: 'translate(-50%, 0)',
        }} style={{
            maxWidth: Math.abs(props.targetX - props.sourceX - 100),
        }}>
        <base_primitives_1.EdgeLabel edgeProps={props}>
          {enableNavigateTo && navigateTo && (<base_primitives_1.EdgeActionButton {...props} onClick={function (e) {
                e.stopPropagation();
                diagram.navigateTo(navigateTo);
            }}/>)}
        </base_primitives_1.EdgeLabel>
      </base_primitives_1.EdgeLabelContainer>
    </base_primitives_1.EdgeContainer>);
});
