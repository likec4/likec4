"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EdgeActionButton = EdgeActionButton;
var css_1 = require("@likec4/styles/css");
var recipes_1 = require("@likec4/styles/recipes");
var core_1 = require("@mantine/core");
var icons_react_1 = require("@tabler/icons-react");
var xyflow_1 = require("../../utils/xyflow");
function EdgeActionButton(_a) {
    var icon = _a.icon, onClick = _a.onClick;
    return (<core_1.ActionIcon className={(0, css_1.cx)('nodrag nopan', (0, recipes_1.edgeActionBtn)())} onPointerDownCapture={xyflow_1.stopPropagation} onClick={onClick} role="button" onDoubleClick={xyflow_1.stopPropagation}>
      {icon !== null && icon !== void 0 ? icon : <icons_react_1.IconZoomScan />}
    </core_1.ActionIcon>);
}
