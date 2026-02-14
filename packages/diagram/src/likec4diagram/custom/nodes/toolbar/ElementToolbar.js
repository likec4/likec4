"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElementToolbar = ElementToolbar;
exports.DeploymentElementToolbar = DeploymentElementToolbar;
var styles_1 = require("@likec4/core/styles");
var core_1 = require("@mantine/core");
var icons_react_1 = require("@tabler/icons-react");
var DiagramFeatures_1 = require("../../../../context/DiagramFeatures");
var xyflow_1 = require("../../../../utils/xyflow");
var _shared_1 = require("./_shared");
var ColorButton_1 = require("./ColorButton");
var Toolbar_1 = require("./Toolbar");
var useHandlers_1 = require("./useHandlers");
var SortedElementShapes = __spreadArray([], styles_1.ElementShapes, true).sort();
function ElementToolbar(props) {
    var _a;
    var _b = (0, DiagramFeatures_1.useEnabledFeatures)(), enableVscode = _b.enableVscode, enableRelationshipBrowser = _b.enableRelationshipBrowser, enableNotes = _b.enableNotes;
    var increaseOffset = !!(enableNotes && props.data.notes);
    var _c = props.data, shape = _c.shape, modelFqn = _c.modelFqn, style = _c.style;
    var _d = (0, useHandlers_1.useHandlers)(modelFqn, props), elementColor = _d.elementColor, onColorPreview = _d.onColorPreview, onChange = _d.onChange;
    return (<Toolbar_1.Toolbar nodeProps={props} title={modelFqn} offset={increaseOffset ? 20 : 10} align="start">
      <ColorButton_1.ColorButton elementColor={elementColor} onColorPreview={onColorPreview} onChange={onChange}/>
      <ElementShapeButton elementShape={shape} onChange={onChange}/>
      <_shared_1.BorderStyleOption elementBorderStyle={(_a = style === null || style === void 0 ? void 0 : style.border) !== null && _a !== void 0 ? _a : 'none'} onChange={onChange}/>
      {enableVscode && <_shared_1.GoToSourceButton elementId={modelFqn}/>}
      {enableRelationshipBrowser && <_shared_1.BrowseRelationshipsButton fqn={modelFqn}/>}
    </Toolbar_1.Toolbar>);
}
function DeploymentElementToolbar(props) {
    var _a;
    var _b = (0, DiagramFeatures_1.useEnabledFeatures)(), enableVscode = _b.enableVscode, enableRelationshipBrowser = _b.enableRelationshipBrowser;
    var _c = props.data, shape = _c.shape, deploymentFqn = _c.deploymentFqn, modelFqn = _c.modelFqn, style = _c.style;
    var _d = (0, useHandlers_1.useHandlers)(deploymentFqn, props), elementColor = _d.elementColor, onColorPreview = _d.onColorPreview, onChange = _d.onChange;
    return (<Toolbar_1.Toolbar nodeProps={props} title={deploymentFqn} align="start">
      <ColorButton_1.ColorButton elementColor={elementColor} onColorPreview={onColorPreview} onChange={onChange}/>
      <ElementShapeButton elementShape={shape} onChange={onChange}/>
      <_shared_1.BorderStyleOption elementBorderStyle={(_a = style === null || style === void 0 ? void 0 : style.border) !== null && _a !== void 0 ? _a : 'none'} onChange={onChange}/>
      {enableVscode && <_shared_1.GoToSourceButton deploymentId={deploymentFqn}/>}
      {enableRelationshipBrowser && modelFqn && <_shared_1.BrowseRelationshipsButton fqn={modelFqn}/>}
    </Toolbar_1.Toolbar>);
}
function ElementShapeButton(_a) {
    var elementShape = _a.elementShape, onChange = _a.onChange;
    return (<core_1.Menu openDelay={300} closeDelay={450} floatingStrategy={'fixed'} closeOnClickOutside clickOutsideEvents={['pointerdown', 'mousedown', 'click']} closeOnEscape closeOnItemClick={false} position="top-start" offset={2} styles={{
            item: {
                padding: 'calc(var(--spacing-xs) / 1.5) var(--spacing-xs)',
            },
        }} withinPortal={false}>
      <core_1.MenuTarget>
        <core_1.Button variant="light" color="gray" size="compact-sm" fz={'xxs'} px={4} pl={8} py={2} rightSection={<icons_react_1.IconSelector size={12}/>}>
          {elementShape}
        </core_1.Button>
      </core_1.MenuTarget>
      <core_1.MenuDropdown onDoubleClick={xyflow_1.stopPropagation} onClick={xyflow_1.stopPropagation}>
        {SortedElementShapes.map(function (shape) { return (<core_1.MenuItem fz={'sm'} 
        // fw={'500'}
        key={shape} value={shape} rightSection={elementShape === shape ? <icons_react_1.IconCheck size={12}/> : undefined} onClick={function (e) {
                e.stopPropagation();
                onChange({ shape: shape });
            }}>
            {shape}
          </core_1.MenuItem>); })}
      </core_1.MenuDropdown>
    </core_1.Menu>);
}
