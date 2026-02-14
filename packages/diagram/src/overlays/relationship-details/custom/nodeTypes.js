"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompoundPorts = exports.ElementPorts = exports.CompoundNode = exports.ElementNode = void 0;
var base_primitives_1 = require("../../../base-primitives");
var ElementActions_1 = require("./ElementActions");
var react_1 = require("@xyflow/react");
var system_1 = require("@xyflow/system");
var DiagramFeatures_1 = require("../../../context/DiagramFeatures");
var hooks_1 = require("../../../hooks");
var useDiagram_1 = require("../../../hooks/useDiagram");
function ElementTags(props) {
    var diagram = (0, useDiagram_1.useDiagram)();
    return (<base_primitives_1.ElementTags onTagClick={(0, hooks_1.useCallbackRef)(function (tag) {
            diagram.openSearch(tag);
        })} {...props}/>);
}
var ElementDetailsButtonWithHandler = function (props) {
    var diagram = (0, useDiagram_1.useDiagram)();
    return (<base_primitives_1.ElementDetailsButton {...props} onClick={function (e) {
            e.stopPropagation();
            diagram.openElementDetails(props.data.fqn);
        }}/>);
};
exports.ElementNode = (0, base_primitives_1.memoNode)(function (props) {
    var enableElementTags = (0, DiagramFeatures_1.useEnabledFeatures)().enableElementTags;
    return (<base_primitives_1.ElementNodeContainer nodeProps={props}>
      <base_primitives_1.ElementShape {...props}/>
      <base_primitives_1.ElementData {...props}/>
      {enableElementTags && <ElementTags {...props}/>}
      <ElementDetailsButtonWithHandler {...props}/>
      <ElementActions_1.ElementActions {...props}/>
      <exports.ElementPorts {...props}/>
    </base_primitives_1.ElementNodeContainer>);
});
exports.CompoundNode = (0, base_primitives_1.memoNode)(function (props) {
    return (<base_primitives_1.CompoundNodeContainer nodeProps={props}>
        <ElementDetailsButtonWithHandler {...props}/>
        <base_primitives_1.CompoundTitle {...props}/>
        <exports.CompoundPorts {...props}/>
      </base_primitives_1.CompoundNodeContainer>);
});
var ElementPorts = function (_a) {
    var _b = _a.data, ports = _b.ports, h = _b.height;
    return (<>
      {ports.in.map(function (id, i) { return (<react_1.Handle key={id} id={id} type="target" position={system_1.Position.Left} style={{
                visibility: 'hidden',
                top: "".concat(15 + (i + 1) * ((h - 30) / (ports.in.length + 1)), "px"),
            }}/>); })}
      {ports.out.map(function (id, i) { return (<react_1.Handle key={id} id={id} type="source" position={system_1.Position.Right} style={{
                visibility: 'hidden',
                top: "".concat(15 + (i + 1) * ((h - 30) / (ports.out.length + 1)), "px"),
            }}/>); })}
    </>);
};
exports.ElementPorts = ElementPorts;
var CompoundPorts = function (_a) {
    var data = _a.data;
    return (<>
    {data.ports.in.map(function (id, i) { return (<react_1.Handle key={id} id={id} type="target" position={system_1.Position.Left} style={{
                visibility: 'hidden',
                top: "".concat(20 * (i + 1), "px"),
            }}/>); })}
    {data.ports.out.map(function (id, i) { return (<react_1.Handle key={id} id={id} type="source" position={system_1.Position.Right} style={{
                visibility: 'hidden',
                top: "".concat(20 * (i + 1), "px"),
            }}/>); })}
  </>);
};
exports.CompoundPorts = CompoundPorts;
