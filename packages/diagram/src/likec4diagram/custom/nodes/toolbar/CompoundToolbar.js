"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompoundElementToolbar = CompoundElementToolbar;
exports.CompoundDeploymentToolbar = CompoundDeploymentToolbar;
var DiagramFeatures_1 = require("../../../../context/DiagramFeatures");
var _shared_1 = require("./_shared");
var ColorButton_1 = require("./ColorButton");
var Toolbar_1 = require("./Toolbar");
var useHandlers_1 = require("./useHandlers");
function CompoundElementToolbar(props) {
    var _a, _b;
    var _c = (0, DiagramFeatures_1.useEnabledFeatures)(), enableVscode = _c.enableVscode, enableRelationshipBrowser = _c.enableRelationshipBrowser;
    var _d = props.data, style = _d.style, modelFqn = _d.modelFqn;
    var _e = (0, useHandlers_1.useHandlers)(modelFqn, props), elementColor = _e.elementColor, onColorPreview = _e.onColorPreview, onChange = _e.onChange;
    var opacity = (_a = style === null || style === void 0 ? void 0 : style.opacity) !== null && _a !== void 0 ? _a : 100;
    return (<Toolbar_1.Toolbar nodeProps={props} title={modelFqn} align="start">
      <ColorButton_1.ColorButton elementColor={elementColor} onColorPreview={onColorPreview} isOpacityEditable elementOpacity={opacity} onChange={onChange} position="left-start"/>
      <_shared_1.BorderStyleOption elementBorderStyle={(_b = style === null || style === void 0 ? void 0 : style.border) !== null && _b !== void 0 ? _b : (opacity < 99 ? 'dashed' : 'none')} onChange={onChange}/>
      {enableVscode && <_shared_1.GoToSourceButton elementId={modelFqn}/>}
      {enableRelationshipBrowser && <_shared_1.BrowseRelationshipsButton fqn={modelFqn}/>}
    </Toolbar_1.Toolbar>);
}
function CompoundDeploymentToolbar(props) {
    var _a = (0, DiagramFeatures_1.useEnabledFeatures)(), enableVscode = _a.enableVscode, enableRelationshipBrowser = _a.enableRelationshipBrowser;
    var _b = props.data, deploymentFqn = _b.deploymentFqn, style = _b.style, modelFqn = _b.modelFqn;
    var _c = (0, useHandlers_1.useHandlers)(deploymentFqn, props), elementColor = _c.elementColor, onColorPreview = _c.onColorPreview, onChange = _c.onChange;
    return (<Toolbar_1.Toolbar nodeProps={props} title={deploymentFqn} align="start">
      <ColorButton_1.ColorButton elementColor={elementColor} onColorPreview={onColorPreview} isOpacityEditable elementOpacity={style === null || style === void 0 ? void 0 : style.opacity} onChange={onChange} position="left-start"/>
      <_shared_1.BorderStyleOption elementBorderStyle={style === null || style === void 0 ? void 0 : style.border} onChange={onChange}/>
      {enableVscode && <_shared_1.GoToSourceButton deploymentId={deploymentFqn}/>}
      {enableRelationshipBrowser && modelFqn && <_shared_1.BrowseRelationshipsButton fqn={modelFqn}/>}
    </Toolbar_1.Toolbar>);
}
