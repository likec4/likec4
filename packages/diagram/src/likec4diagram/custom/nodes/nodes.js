"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElementDetailsButtonWithHandler = ElementDetailsButtonWithHandler;
exports.CompoundDetailsButtonWithHandler = CompoundDetailsButtonWithHandler;
exports.ElementNode = ElementNode;
exports.DeploymentNode = DeploymentNode;
exports.CompoundElementNode = CompoundElementNode;
exports.CompoundDeploymentNode = CompoundDeploymentNode;
exports.ViewGroupNode = ViewGroupNode;
var css_1 = require("@likec4/styles/css");
var base_primitives_1 = require("../../../base-primitives");
var DiagramFeatures_1 = require("../../../context/DiagramFeatures");
var hooks_1 = require("../../../hooks");
var useDiagram_1 = require("../../../hooks/useDiagram");
var CompoundActions_1 = require("./CompoundActions");
var ElementActions_1 = require("./ElementActions");
var NodeDrifts_1 = require("./NodeDrifts");
var NodeNotes_1 = require("./NodeNotes");
var CompoundToolbar_1 = require("./toolbar/CompoundToolbar");
var ElementToolbar_1 = require("./toolbar/ElementToolbar");
function ElementTags(props) {
    var diagram = (0, useDiagram_1.useDiagram)();
    return (<base_primitives_1.ElementTags onTagClick={(0, hooks_1.useCallbackRef)(function (tag) {
            diagram.openSearch(tag);
        })} onTagMouseEnter={(0, hooks_1.useCallbackRef)(function (tag) {
            diagram.send({ type: 'tag.highlight', tag: tag });
        })} onTagMouseLeave={(0, hooks_1.useCallbackRef)(function (_tag) {
            diagram.send({ type: 'tag.unhighlight' });
        })} {...props}/>);
}
function ElementDetailsButtonWithHandler(props) {
    var diagram = (0, useDiagram_1.useDiagram)();
    var fqn = props.data.modelFqn;
    if (!fqn)
        return null;
    return (<base_primitives_1.ElementDetailsButton {...props} onClick={function (e) {
            e.stopPropagation();
            diagram.openElementDetails(fqn, props.id);
        }}/>);
}
function CompoundDetailsButtonWithHandler(props) {
    var diagram = (0, useDiagram_1.useDiagram)();
    var fqn = props.data.modelFqn;
    if (!fqn)
        return null;
    return (<base_primitives_1.CompoundDetailsButton {...props} onClick={function (e) {
            e.stopPropagation();
            diagram.openElementDetails(fqn, props.id);
        }}/>);
}
/**
 * Renders an element node.
 */
function ElementNode(props) {
    var _a = (0, DiagramFeatures_1.useEnabledFeatures)(), enableElementTags = _a.enableElementTags, enableElementDetails = _a.enableElementDetails, enableReadOnly = _a.enableReadOnly, enableCompareWithLatest = _a.enableCompareWithLatest, enableNotes = _a.enableNotes;
    return (<base_primitives_1.ElementNodeContainer nodeProps={props}>
      {enableCompareWithLatest && <NodeDrifts_1.NodeDrifts nodeProps={props}/>}
      <base_primitives_1.ElementShape {...props}/>
      <base_primitives_1.ElementData {...props}/>
      {enableElementTags && <ElementTags {...props}/>}
      <ElementActions_1.ElementActions {...props}/>
      {enableElementDetails && <ElementDetailsButtonWithHandler {...props}/>}
      {!enableReadOnly && <ElementToolbar_1.ElementToolbar {...props}/>}
      {enableNotes && <NodeNotes_1.NodeNotes {...props}/>}
      <base_primitives_1.DefaultHandles direction={props.data.viewLayoutDir}/>
    </base_primitives_1.ElementNodeContainer>);
}
function DeploymentNode(props) {
    var _a = (0, DiagramFeatures_1.useEnabledFeatures)(), enableElementTags = _a.enableElementTags, enableElementDetails = _a.enableElementDetails, enableReadOnly = _a.enableReadOnly, enableCompareWithLatest = _a.enableCompareWithLatest, enableNotes = _a.enableNotes;
    return (<base_primitives_1.ElementNodeContainer nodeProps={props}>
      {enableCompareWithLatest && <NodeDrifts_1.NodeDrifts nodeProps={props}/>}
      <base_primitives_1.ElementShape {...props}/>
      <base_primitives_1.ElementData {...props}/>
      {enableElementTags && <ElementTags {...props}/>}
      <ElementActions_1.DeploymentElementActions {...props}/>
      {enableElementDetails && <ElementDetailsButtonWithHandler {...props}/>}
      {!enableReadOnly && <ElementToolbar_1.DeploymentElementToolbar {...props}/>}
      {enableNotes && <NodeNotes_1.NodeNotes {...props}/>}
      <base_primitives_1.DefaultHandles direction={props.data.viewLayoutDir}/>
    </base_primitives_1.ElementNodeContainer>);
}
var compoundHasDrifts = (0, css_1.css)({
    outlineColor: 'likec4.compare.manual.outline',
    outlineWidth: '4px',
    outlineStyle: 'dashed',
    outlineOffset: '1.5',
});
var hasDrifts = function (props) {
    return props.data.drifts && props.data.drifts.length > 0;
};
function CompoundElementNode(props) {
    var _a = (0, DiagramFeatures_1.useEnabledFeatures)(), enableElementDetails = _a.enableElementDetails, enableReadOnly = _a.enableReadOnly, enableCompareWithLatest = _a.enableCompareWithLatest;
    var showDrifts = enableCompareWithLatest && hasDrifts(props);
    return (<base_primitives_1.CompoundNodeContainer className={showDrifts ? compoundHasDrifts : undefined} nodeProps={props}>
      {enableCompareWithLatest && <NodeDrifts_1.NodeDrifts nodeProps={props}/>}
      <base_primitives_1.CompoundTitle {...props}/>
      <CompoundActions_1.CompoundActions {...props}/>
      {enableElementDetails && <CompoundDetailsButtonWithHandler {...props}/>}
      {!enableReadOnly && <CompoundToolbar_1.CompoundElementToolbar {...props}/>}
      <base_primitives_1.DefaultHandles direction={props.data.viewLayoutDir}/>
    </base_primitives_1.CompoundNodeContainer>);
}
function CompoundDeploymentNode(props) {
    var _a = (0, DiagramFeatures_1.useEnabledFeatures)(), enableElementDetails = _a.enableElementDetails, enableReadOnly = _a.enableReadOnly, enableCompareWithLatest = _a.enableCompareWithLatest;
    var showDrifts = enableCompareWithLatest && hasDrifts(props);
    return (<base_primitives_1.CompoundNodeContainer className={showDrifts ? compoundHasDrifts : undefined} nodeProps={props}>
      {enableCompareWithLatest && <NodeDrifts_1.NodeDrifts nodeProps={props}/>}
      <base_primitives_1.CompoundTitle {...props}/>
      <CompoundActions_1.CompoundActions {...props}/>
      {enableElementDetails && <CompoundDetailsButtonWithHandler {...props}/>}
      {!enableReadOnly && <CompoundToolbar_1.CompoundDeploymentToolbar {...props}/>}
      <base_primitives_1.DefaultHandles direction={props.data.viewLayoutDir}/>
    </base_primitives_1.CompoundNodeContainer>);
}
function ViewGroupNode(props) {
    var enableCompareWithLatest = (0, DiagramFeatures_1.useEnabledFeatures)().enableCompareWithLatest;
    var showDrifts = enableCompareWithLatest && hasDrifts(props);
    return (<base_primitives_1.CompoundNodeContainer className={showDrifts ? compoundHasDrifts : undefined} nodeProps={props}>
      {enableCompareWithLatest && <NodeDrifts_1.NodeDrifts nodeProps={props}/>}
      <base_primitives_1.CompoundTitle {...props}/>
      <base_primitives_1.DefaultHandles direction={props.data.viewLayoutDir}/>
    </base_primitives_1.CompoundNodeContainer>);
}
