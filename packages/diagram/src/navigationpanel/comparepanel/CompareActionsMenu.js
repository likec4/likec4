"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompareActionsMenu = CompareActionsMenu;
var css_1 = require("@likec4/styles/css");
var jsx_1 = require("@likec4/styles/jsx");
var patterns_1 = require("@likec4/styles/patterns");
var core_1 = require("@mantine/core");
var icons_react_1 = require("@tabler/icons-react");
var utils_1 = require("../../utils");
function CompareActionsMenu(_a) {
    var _b = _a.disabled, disabled = _b === void 0 ? false : _b, onApplyLatestToManual = _a.onApplyLatestToManual, onResetManualLayout = _a.onResetManualLayout;
    return (<core_1.Menu withinPortal={false} // if we render menu in portal, NavigationPanelDropdown receives onMouseLeave event
     floatingStrategy="absolute" shadow="lg" position="bottom-start" offset={{ mainAxis: 4 }} disabled={disabled}>
      <core_1.Menu.Target>
        <core_1.UnstyledButton disabled={disabled} className={(0, css_1.cx)('mantine-active', (0, patterns_1.hstack)({
            gap: '2',
            py: '1.5',
            px: '2',
            lineHeight: '1',
            textStyle: 'xs',
            fontWeight: 'medium',
            layerStyle: 'likec4.panel.action',
            userSelect: 'none',
        }))}>
          <jsx_1.Box>Actions</jsx_1.Box>
          <icons_react_1.IconChevronDown size={12} stroke={2} opacity={0.7}/>
        </core_1.UnstyledButton>
      </core_1.Menu.Target>

      <core_1.Menu.Dropdown>
        <core_1.Menu.Item disabled={!onApplyLatestToManual} onClick={onApplyLatestToManual} rightSection={onApplyLatestToManual &&
            (<core_1.Tooltip onClick={utils_1.stopPropagation} position="right-start" label={<>
                    Applies changes from the latest auto-layouted<br />
                    to saved snapshot, preserving (as possible)<br />
                    manual adjustments.<br />
                    <br />
                    You can undo this action.
                  </>}>
                <icons_react_1.IconInfoCircle size={14} stroke={1.7} opacity={0.5}/>
              </core_1.Tooltip>)}>
          Sync with latest
          {!onApplyLatestToManual && <jsx_1.Box textStyle={'xs'}>view type is changed</jsx_1.Box>}
        </core_1.Menu.Item>
        <core_1.Menu.Item onClick={onResetManualLayout}>Remove manual layout</core_1.Menu.Item>
      </core_1.Menu.Dropdown>
    </core_1.Menu>);
}
