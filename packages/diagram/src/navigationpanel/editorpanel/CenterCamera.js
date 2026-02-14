"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CenterCamera = void 0;
var icons_react_1 = require("@tabler/icons-react");
var useDiagram_1 = require("../../hooks/useDiagram");
var _common_1 = require("../_common");
var _common_2 = require("./_common");
var CenterCamera = function () {
    var diagram = (0, useDiagram_1.useDiagram)();
    return (<_common_2.Tooltip label="Center camera">
      <_common_1.PanelActionIcon onClick={function () { return diagram.fitDiagram(); }}>
        <icons_react_1.IconFocusCentered />
      </_common_1.PanelActionIcon>
    </_common_2.Tooltip>);
};
exports.CenterCamera = CenterCamera;
