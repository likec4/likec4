"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComparePanelControls = ComparePanelControls;
var jsx_1 = require("@likec4/styles/jsx");
var core_1 = require("@mantine/core");
var icons_react_1 = require("@tabler/icons-react");
var useDiagramCompareLayout_1 = require("../../hooks/useDiagramCompareLayout");
var _common_1 = require("../_common");
var CompareActionsMenu_1 = require("./CompareActionsMenu");
var LayoutTypeSwitcher_1 = require("./LayoutTypeSwitcher");
var Divider = core_1.Divider.withProps({
    mx: 2,
    size: 'xs',
    orientation: 'vertical',
});
function ComparePanelControls() {
    var _a = (0, useDiagramCompareLayout_1.useDiagramCompareLayout)(), ctx = _a[0], _b = _a[1], toggleCompare = _b.toggleCompare, switchLayout = _b.switchLayout, resetManualLayout = _b.resetManualLayout, applyLatestToManual = _b.applyLatestToManual;
    return (<>
      <jsx_1.Box css={{
            textStyle: 'xs',
            color: 'likec4.panel.text',
            userSelect: 'none',
        }}>
        Compare
      </jsx_1.Box>
      <LayoutTypeSwitcher_1.LayoutTypeSwitcher value={ctx.layout} onChange={switchLayout}/>
      {ctx.hasEditor && (<jsx_1.HStack gap={'1'}>
          <Divider />
          <CompareActionsMenu_1.CompareActionsMenu disabled={ctx.layout === 'auto'} onResetManualLayout={resetManualLayout} onApplyLatestToManual={ctx.canApplyLatest ? applyLatestToManual : undefined}/>
          <Divider />
        </jsx_1.HStack>)}

      <_common_1.PanelActionIcon size={'sm'} onClick={function (e) {
            e.stopPropagation();
            toggleCompare();
        }}>
        <icons_react_1.IconX />
      </_common_1.PanelActionIcon>
    </>);
}
