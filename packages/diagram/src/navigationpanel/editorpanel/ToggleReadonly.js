"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToggleReadonly = void 0;
var icons_react_1 = require("@tabler/icons-react");
var useDiagram_1 = require("../../hooks/useDiagram");
var _common_1 = require("../_common");
var _common_2 = require("./_common");
var ToggleReadonly = function () {
    var diagram = (0, useDiagram_1.useDiagram)();
    return (<_common_2.Tooltip label="Switch to Read-only">
      <_common_1.PanelActionIcon onClick={function () { return diagram.toggleFeature('ReadOnly'); }}>
        <icons_react_1.IconLockOpen2 size={14} stroke={2}/>
      </_common_1.PanelActionIcon>
    </_common_2.Tooltip>);
};
exports.ToggleReadonly = ToggleReadonly;
