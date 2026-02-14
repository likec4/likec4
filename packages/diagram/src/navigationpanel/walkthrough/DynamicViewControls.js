"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TriggerWalkthroughButton = void 0;
exports.DynamicViewControls = DynamicViewControls;
var core_1 = require("@likec4/core");
var css_1 = require("@likec4/styles/css");
var core_2 = require("@mantine/core");
var icons_react_1 = require("@tabler/icons-react");
var react_1 = require("motion/react");
var m = require("motion/react-m");
var react_2 = require("react");
var DiagramFeatures_1 = require("../../context/DiagramFeatures");
var useDiagram_1 = require("../../hooks/useDiagram");
var _common_1 = require("../_common");
var hooks_1 = require("../hooks");
exports.TriggerWalkthroughButton = (0, react_2.forwardRef)(function (props, ref) { return (<core_2.Button variant="filled" size="xs" fw="500" {...props} ref={ref} component={m.button} whileTap={{
        scale: 0.95,
    }} layout="position" layoutId={'trigger-dynamic-walkthrough'} className={(0, css_1.css)({
        flexShrink: 0,
    })}/>); });
function StartWalkthroughButton() {
    var _a = (0, DiagramFeatures_1.useEnabledFeatures)(), enableReadOnly = _a.enableReadOnly, enableCompareWithLatest = _a.enableCompareWithLatest;
    var diagram = (0, useDiagram_1.useDiagram)();
    var actor = (0, hooks_1.useNavigationActor)();
    var tooltipLabel = 'Start Dynamic View Walkthrough';
    switch (true) {
        case !enableReadOnly:
            tooltipLabel = 'Walkthrough not available in Edit mode';
            break;
        case enableCompareWithLatest:
            tooltipLabel = 'Walkthrough not available when Compare is active';
            break;
    }
    return (<_common_1.Tooltip label={tooltipLabel}>
      <exports.TriggerWalkthroughButton onClick={function (e) {
            e.stopPropagation();
            actor.closeDropdown();
            diagram.startWalkthrough();
        }} initial={{ opacity: 0, scale: 0.6, translateX: -10 }} animate={{ opacity: 1, scale: 1, translateX: 0 }} exit={{ opacity: 0, translateX: -20 }} size="compact-xs" h={26} disabled={!enableReadOnly || enableCompareWithLatest} classNames={{
            label: (0, css_1.css)({
                display: {
                    base: 'none',
                    '@/md': 'inherit',
                },
            }),
            section: (0, css_1.css)({
                marginInlineStart: {
                    base: '0',
                    '@/md': '2',
                },
            }),
        }} rightSection={<icons_react_1.IconPlayerPlayFilled size={10}/>}>
        Start
      </exports.TriggerWalkthroughButton>
    </_common_1.Tooltip>);
}
var DynamicViewModeSwitcher = (0, react_2.forwardRef)(function (_a, ref) {
    var value = _a.value, onChange = _a.onChange;
    return (<m.div ref={ref} layout="position">
      <core_2.SegmentedControl size="xs" value={value} component={m.div} onChange={function (variant) {
            (0, core_1.invariant)(variant === 'diagram' || variant === 'sequence', 'Invalid dynamic view variant');
            onChange(variant);
        }} classNames={{
            label: (0, css_1.css)({
                fontSize: 'xxs',
            }),
        }} data={[
            {
                value: 'diagram',
                label: 'Diagram',
            },
            {
                value: 'sequence',
                label: 'Sequence',
            },
        ]}/>
    </m.div>);
});
function DynamicViewControls() {
    var dynamicViewVariant = (0, useDiagram_1.useDiagramContext)(function (c) { return c.dynamicViewVariant; });
    var diagram = (0, useDiagram_1.useDiagram)();
    return (<react_1.AnimatePresence>
      <DynamicViewModeSwitcher value={dynamicViewVariant} onChange={function (mode) {
            diagram.switchDynamicViewVariant(mode);
        }}/>
      <StartWalkthroughButton key="trigger-dynamic-walkthrough"/>
    </react_1.AnimatePresence>);
}
