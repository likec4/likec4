"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelationshipEdge = void 0;
var base_primitives_1 = require("../../base-primitives");
var xyflow_1 = require("../../utils/xyflow");
exports.RelationshipEdge = (0, base_primitives_1.memoEdge)(function (edgeProps) {
    var path = (0, xyflow_1.bezierPath)(edgeProps.data.points);
    return (<base_primitives_1.EdgeContainer {...edgeProps}>
      <base_primitives_1.EdgePath edgeProps={edgeProps} svgPath={path}/>
      <base_primitives_1.EdgeLabelContainer edgeProps={edgeProps}>
        <base_primitives_1.EdgeLabel edgeProps={edgeProps}/>
      </base_primitives_1.EdgeLabelContainer>
    </base_primitives_1.EdgeContainer>);
});
