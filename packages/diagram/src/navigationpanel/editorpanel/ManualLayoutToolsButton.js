"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManualLayoutToolsButton = void 0;
var css_1 = require("@likec4/styles/css");
var patterns_1 = require("@likec4/styles/patterns");
var core_1 = require("@mantine/core");
var icons_react_1 = require("@tabler/icons-react");
var react_1 = require("react");
var useDiagram_1 = require("../../hooks/useDiagram");
var useMantinePortalProps_1 = require("../../hooks/useMantinePortalProps");
var _common_1 = require("../_common");
var _common_2 = require("./_common");
var Action = function (_a) {
    var label = _a.label, icon = _a.icon, onClick = _a.onClick;
    return (<_common_2.Tooltip label={label} withinPortal={false} position="top">
    <_common_1.PanelActionIcon classNames={{
            root: 'action-icon',
            icon: (0, css_1.css)({
                '& > svg': {
                    width: '70%',
                    height: '70%',
                },
            }),
        }} onClick={onClick}>
      {icon}
    </_common_1.PanelActionIcon>
  </_common_2.Tooltip>);
};
exports.ManualLayoutToolsButton = (0, react_1.memo)(function () {
    var diagram = (0, useDiagram_1.useDiagram)();
    var portalProps = (0, useMantinePortalProps_1.useMantinePortalProps)();
    return (<core_1.Popover position="right" offset={{
            mainAxis: 12,
        }} clickOutsideEvents={[
            'pointerdown',
        ]} {...portalProps}>
      <core_1.PopoverTarget>
        <_common_2.Tooltip label="Manual layouting tools">
          <_common_1.PanelActionIcon>
            <icons_react_1.IconLayoutCollage />
          </_common_1.PanelActionIcon>
        </_common_2.Tooltip>
      </core_1.PopoverTarget>
      <core_1.PopoverDropdown className={(0, patterns_1.hstack)({
            gap: '0.5',
            layerStyle: 'likec4.panel',
            padding: '1',
            pointerEvents: 'all',
        })}>
        <core_1.TooltipGroup>
          <Action label="Align in columns" icon={<icons_react_1.IconLayoutBoardSplit />} onClick={function (e) {
            e.stopPropagation();
            diagram.align('Column');
        }}/>
          <Action label="Align left" icon={<icons_react_1.IconLayoutAlignLeft />} onClick={function (e) {
            e.stopPropagation();
            diagram.align('Left');
        }}/>
          <Action label="Align center" icon={<icons_react_1.IconLayoutAlignCenter />} onClick={function (e) {
            e.stopPropagation();
            diagram.align('Center');
        }}/>
          <Action label="Align right" icon={<icons_react_1.IconLayoutAlignRight />} onClick={function (e) {
            e.stopPropagation();
            diagram.align('Right');
        }}/>
          <Action label="Align in rows" icon={<icons_react_1.IconLayoutBoardSplit style={{ transform: 'rotate(90deg)' }}/>} onClick={function (e) {
            e.stopPropagation();
            diagram.align('Row');
        }}/>
          <Action label="Align top" icon={<icons_react_1.IconLayoutAlignTop />} onClick={function (e) {
            e.stopPropagation();
            diagram.align('Top');
        }}/>
          <Action label="Align middle" icon={<icons_react_1.IconLayoutAlignMiddle />} onClick={function (e) {
            e.stopPropagation();
            diagram.align('Middle');
        }}/>
          <Action label="Align bottom" icon={<icons_react_1.IconLayoutAlignBottom />} onClick={function (e) {
            e.stopPropagation();
            diagram.align('Bottom');
        }}/>
          <Action label="Reset all control points" icon={<icons_react_1.IconRouteOff />} onClick={function (e) {
            e.stopPropagation();
            diagram.resetEdgeControlPoints();
        }}/>
        </core_1.TooltipGroup>
      </core_1.PopoverDropdown>
    </core_1.Popover>);
});
exports.ManualLayoutToolsButton.displayName = 'ManualLayoutToolsButton';
