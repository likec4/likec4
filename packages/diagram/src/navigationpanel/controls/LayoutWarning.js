"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LayoutWarning = void 0;
var css_1 = require("@likec4/styles/css");
var patterns_1 = require("@likec4/styles/patterns");
var recipes_1 = require("@likec4/styles/recipes");
var core_1 = require("@mantine/core");
var icons_react_1 = require("@tabler/icons-react");
var react_1 = require("motion/react");
var m = require("motion/react-m");
var react_2 = require("react");
var useDiagramCompareLayout_1 = require("../../hooks/useDiagramCompareLayout");
var useMantinePortalProps_1 = require("../../hooks/useMantinePortalProps");
exports.LayoutWarning = (0, react_2.memo)(function () {
    var _a = (0, useDiagramCompareLayout_1.useDiagramCompareLayout)(), ctx = _a[0], toggleCompare = _a[1].toggleCompare;
    var portalProps = (0, useMantinePortalProps_1.useMantinePortalProps)();
    var drifts = ctx.drifts, isActive = ctx.isActive, isEnabled = ctx.isEnabled;
    return (<react_1.AnimatePresence propagate>
      {isEnabled && !isActive && (<core_1.HoverCard position="bottom-start" openDelay={600} closeDelay={200} floatingStrategy="absolute" offset={{
                mainAxis: 4,
                crossAxis: -22,
            }} {...portalProps}>
          <core_1.HoverCardTarget>
            <core_1.UnstyledButton component={m.button} layout="position" onClick={function (e) {
                e.stopPropagation();
                toggleCompare();
            }} whileTap={{
                scale: 0.95,
                translateY: 1,
            }} className={(0, css_1.cx)('group', (0, recipes_1.navigationPanelActionIcon)({
                variant: 'filled',
                type: 'warning',
            }), (0, patterns_1.hstack)({
                gap: 'xxs',
                padding: '1.5',
                rounded: 'sm',
                userSelect: 'none',
                cursor: 'pointer',
                fontSize: 'xs',
                fontWeight: 'bold',
            }))}>
              {isActive ? <>Stop Compare</> : <icons_react_1.IconAlertTriangle size={18}/>}
            </core_1.UnstyledButton>
          </core_1.HoverCardTarget>
          <core_1.HoverCardDropdown p={'0'}>
            <core_1.Notification color="orange" withBorder={false} withCloseButton={false} title="View is out of sync">
              <core_1.Text mt={2} size="sm" lh="xs">
                Model has changed since this view was last updated.
              </core_1.Text>
              <core_1.Text mt={4} size="sm" lh="xs">
                Detected changes:
                {drifts.map(function (drift) { return (<react_2.Fragment key={drift}>
                    <br />
                    <span>- {drift}</span>
                  </react_2.Fragment>); })}
              </core_1.Text>

              <core_1.Button mt={'xs'} size="compact-sm" variant="default" onClick={function (e) {
                e.stopPropagation();
                toggleCompare();
            }}>
                Compare with current state
              </core_1.Button>
            </core_1.Notification>
          </core_1.HoverCardDropdown>
        </core_1.HoverCard>)}
    </react_1.AnimatePresence>);
});
exports.LayoutWarning.displayName = 'ManualLayoutWarning';
