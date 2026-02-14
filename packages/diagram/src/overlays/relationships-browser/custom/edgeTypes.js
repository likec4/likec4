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
exports.RelationshipEdge = void 0;
var css_1 = require("@likec4/styles/css");
var core_1 = require("@mantine/core");
var system_1 = require("@xyflow/system");
var base_primitives_1 = require("../../../base-primitives");
var context_1 = require("../../../context");
var useDiagram_1 = require("../../../hooks/useDiagram");
var hooks_1 = require("../hooks");
exports.RelationshipEdge = (0, base_primitives_1.memoEdge)(function (props) {
    var browser = (0, hooks_1.useRelationshipsBrowser)();
    var enableNavigateTo = (0, context_1.useEnabledFeatures)().enableNavigateTo;
    var _a = props.data, navigateTo = _a.navigateTo, relations = _a.relations, existsInCurrentView = _a.existsInCurrentView;
    var _b = (0, system_1.getBezierPath)(props), svgPath = _b[0], labelX = _b[1], labelY = _b[2];
    var diagram = (0, useDiagram_1.useDiagram)();
    var markOrange = relations.length > 1 || !existsInCurrentView;
    var edgeProps = markOrange
        ? __assign(__assign({}, props), { data: __assign(__assign({}, props.data), { color: 'amber' }) }) : props;
    var label = (<base_primitives_1.EdgeLabel edgeProps={edgeProps} className={(0, css_1.css)({
            transition: 'fast',
        })}>
      {enableNavigateTo && navigateTo && (<base_primitives_1.EdgeActionButton {...props} onClick={function (e) {
                e.stopPropagation();
                diagram.navigateTo(navigateTo);
            }}/>)}
    </base_primitives_1.EdgeLabel>);
    if (!existsInCurrentView) {
        label = (<core_1.Tooltip color="orange" c={'black'} label="This relationship is not included in the current view" 
        // withinPortal={false}
        portalProps={{
                target: "#".concat(browser.rootElementId),
            }} openDelay={800}>
        {label}
      </core_1.Tooltip>);
    }
    return (<base_primitives_1.EdgeContainer {...edgeProps}>
      <base_primitives_1.EdgePath edgeProps={edgeProps} svgPath={svgPath} {...markOrange && {
        strokeWidth: 5,
    }}/>
      <base_primitives_1.EdgeLabelContainer edgeProps={edgeProps} labelPosition={{
            x: labelX,
            y: labelY,
            translate: 'translate(-50%, 0)',
        }} style={{
            maxWidth: Math.min(Math.abs(props.targetX - props.sourceX - 70), 250),
        }}>
        {label}
      </base_primitives_1.EdgeLabelContainer>
    </base_primitives_1.EdgeContainer>);
});
