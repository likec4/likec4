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
exports.ChangeAutoLayoutButton = void 0;
var core_1 = require("@mantine/core");
var hooks_1 = require("@mantine/hooks");
var web_1 = require("@react-hookz/web");
var icons_react_1 = require("@tabler/icons-react");
var react_1 = require("react");
var useDiagram_1 = require("../../hooks/useDiagram");
var _common_1 = require("../_common");
var _common_2 = require("./_common");
var css = require("./styles");
var selector = function (state) { return ({
    viewId: state.view.id,
    isManualLayout: state.view._layout === 'manual',
    autoLayout: state.view.autoLayout,
}); };
var ChangeAutoLayoutButton = function () {
    var diagram = (0, useDiagram_1.useDiagram)();
    var _a = (0, react_1.useState)(null), rootRef = _a[0], setRootRef = _a[1];
    var _b = (0, react_1.useState)({}), controlsRefs = _b[0], setControlsRefs = _b[1];
    var _c = (0, useDiagram_1.useDiagramContext)(selector), autoLayout = _c.autoLayout, viewId = _c.viewId, isManualLayout = _c.isManualLayout;
    var _d = (0, hooks_1.useHover)(), ref = _d.ref, isSpacingHovered = _d.hovered;
    var setControlRef = function (name) { return function (node) {
        controlsRefs[name] = node;
        setControlsRefs(controlsRefs);
    }; };
    var setAutoLayout = function (direction) { return function (event) {
        event.stopPropagation();
        diagram.fitDiagram();
        diagram.triggerChange({
            op: 'change-autolayout',
            layout: __assign(__assign({}, autoLayout), { direction: direction }),
        });
    }; };
    var setSpacing = function (nodeSep, rankSep) {
        // Force fitDiagram
        diagram.fitDiagram();
        diagram.triggerChange({
            op: 'change-autolayout',
            layout: __assign(__assign({}, autoLayout), { nodeSep: nodeSep, rankSep: rankSep }),
        });
    };
    // TODO: Show only for auto layout
    if (isManualLayout) {
        return null;
    }
    return (<core_1.Popover position="right-start" clickOutsideEvents={[
            'pointerdown',
        ]} radius="xs" shadow="lg" offset={{
            mainAxis: 10,
        }}>
      <core_1.PopoverTarget>
        <_common_2.Tooltip label="Change Auto Layout">
          <_common_1.PanelActionIcon>
            <icons_react_1.IconLayoutDashboard />
          </_common_1.PanelActionIcon>
        </_common_2.Tooltip>
      </core_1.PopoverTarget>
      <core_1.PopoverDropdown className="likec4-top-left-panel" p={8} pt={6} opacity={isSpacingHovered ? 0.6 : 1}>
        <core_1.Box pos={'relative'} ref={setRootRef}>
          <core_1.FloatingIndicator target={controlsRefs[autoLayout.direction]} parent={rootRef} className={css.autolayoutIndicator}/>
          <core_1.Box mb={10}>
            <core_1.Text inline fz={'xs'} c={'dimmed'} fw={500}>Auto layout:</core_1.Text>
          </core_1.Box>
          <core_1.Flex gap={2} wrap={'wrap'} justify={'stretch'} maw={160}>
            <core_1.UnstyledButton className={css.autolayoutButton} ref={setControlRef('TB')} onClick={setAutoLayout('TB')}>
              Top-Bottom
            </core_1.UnstyledButton>
            <core_1.UnstyledButton className={css.autolayoutButton} ref={setControlRef('BT')} onClick={setAutoLayout('BT')}>
              Bottom-Top
            </core_1.UnstyledButton>
            <core_1.UnstyledButton className={css.autolayoutButton} ref={setControlRef('LR')} onClick={setAutoLayout('LR')}>
              Left-Right
            </core_1.UnstyledButton>
            <core_1.UnstyledButton className={css.autolayoutButton} ref={setControlRef('RL')} onClick={setAutoLayout('RL')}>
              Right-Left
            </core_1.UnstyledButton>
          </core_1.Flex>
          <core_1.Box my={10}>
            <core_1.Text inline fz={'xs'} c={'dimmed'} fw={500}>Spacing:</core_1.Text>
          </core_1.Box>
          <SpacingSliders ref={ref} isVertical={autoLayout.direction === 'TB' || autoLayout.direction === 'BT'} key={viewId} nodeSep={autoLayout.nodeSep} rankSep={autoLayout.rankSep} onChange={setSpacing}/>
        </core_1.Box>
      </core_1.PopoverDropdown>
    </core_1.Popover>);
};
exports.ChangeAutoLayoutButton = ChangeAutoLayoutButton;
var MAX_SPACING = 400;
var SpacingSliders = (0, react_1.forwardRef)(function (_a, _ref) {
    var _b, _c;
    var isVertical = _a.isVertical, nodeSep = _a.nodeSep, rankSep = _a.rankSep, onChange = _a.onChange;
    if (!isVertical) {
        ;
        _b = [rankSep, nodeSep], nodeSep = _b[0], rankSep = _b[1];
    }
    var propagateChange = (0, web_1.useDebouncedCallback)(function (_a) {
        var _b;
        var x = _a.x, y = _a.y;
        if (!isVertical) {
            ;
            _b = [y, x], x = _b[0], y = _b[1];
        }
        onChange(Math.round(x * MAX_SPACING), Math.round(y * MAX_SPACING));
    }, [onChange, isVertical], 250, 2000);
    var _d = (0, hooks_1.useUncontrolled)({
        defaultValue: (0, hooks_1.clampUseMovePosition)({
            x: (nodeSep !== null && nodeSep !== void 0 ? nodeSep : 100) / MAX_SPACING,
            y: (rankSep !== null && rankSep !== void 0 ? rankSep : 120) / MAX_SPACING,
        }),
        onChange: propagateChange,
    }), value = _d[0], setValue = _d[1];
    var ref = (0, hooks_1.useMove)(setValue).ref;
    var nodeSepValue = Math.round(value.x * MAX_SPACING);
    var rankSepValue = Math.round(value.y * MAX_SPACING);
    if (!isVertical) {
        ;
        _c = [rankSepValue, nodeSepValue], nodeSepValue = _c[0], rankSepValue = _c[1];
    }
    var mergedRef = (0, hooks_1.useMergedRef)(ref, _ref);
    return (<core_1.Box ref={mergedRef} className={css.spacingSliderBody} pt={'100%'}>
      <core_1.Box className={css.spacingSliderThumb} style={{
            left: "".concat(value.x * 100, "%"),
            top: "".concat(value.y * 100, "%"),
        }}/>
      <core_1.Box pos={'absolute'} left={2} bottom={2}>
        <core_1.Text component="div" fz={8} c={'dimmed'} fw={500}>{rankSepValue}, {nodeSepValue}</core_1.Text>
      </core_1.Box>
    </core_1.Box>);
});
