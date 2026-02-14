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
exports.SequenceStepEdge = SequenceStepEdge;
var system_1 = require("@xyflow/system");
var base_primitives_1 = require("../../../base-primitives");
var DiagramFeatures_1 = require("../../../context/DiagramFeatures");
var useDiagram_1 = require("../../../hooks/useDiagram");
var EdgeDrifts_1 = require("./EdgeDrifts");
var LABEL_OFFSET = 16;
function SequenceStepEdge(props) {
    var _a = (0, DiagramFeatures_1.useEnabledFeatures)(), enableNavigateTo = _a.enableNavigateTo, enableCompareWithLatest = _a.enableCompareWithLatest;
    var diagram = (0, useDiagram_1.useDiagram)();
    var navigateTo = props.data.navigateTo;
    var isSelfLoop = props.source === props.target;
    var isBack = props.sourceX > props.targetX;
    var path = (0, system_1.getSmoothStepPath)(__assign({ sourceX: props.sourceX, sourceY: props.sourceY, sourcePosition: props.sourcePosition, targetX: props.targetX, targetY: props.targetY, targetPosition: props.targetPosition }, (isSelfLoop && {
        offset: 30,
        borderRadius: 16,
    })))[0];
    var labelX = props.sourceX;
    switch (true) {
        case isSelfLoop:
            labelX = props.sourceX + 24 + LABEL_OFFSET;
            break;
        case isBack:
            labelX = props.sourceX - LABEL_OFFSET;
            break;
        default:
            labelX = props.sourceX + LABEL_OFFSET;
            break;
    }
    return (<base_primitives_1.EdgeContainer {...props}>
      <base_primitives_1.EdgePath edgeProps={props} svgPath={path}/>
      {enableCompareWithLatest && <EdgeDrifts_1.EdgeDrifts edgeProps={props} svgPath={path}/>}
      <base_primitives_1.EdgeLabelContainer edgeProps={props} labelPosition={{
            x: labelX,
            y: props.sourceY + (!isSelfLoop ? LABEL_OFFSET : 0),
            translate: isBack ? 'translate(-100%, 0)' : undefined,
        }}>
        <base_primitives_1.EdgeLabel edgeProps={props}>
          {enableNavigateTo && navigateTo && (<base_primitives_1.EdgeActionButton onClick={function (e) {
                e.stopPropagation();
                diagram.navigateTo(navigateTo);
            }}/>)}
        </base_primitives_1.EdgeLabel>
      </base_primitives_1.EdgeLabelContainer>
    </base_primitives_1.EdgeContainer>);
}
