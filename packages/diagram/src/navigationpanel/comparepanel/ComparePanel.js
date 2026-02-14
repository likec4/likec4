"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComparePanel = void 0;
var css_1 = require("@likec4/styles/css");
var jsx_1 = require("@likec4/styles/jsx");
var patterns_1 = require("@likec4/styles/patterns");
var core_1 = require("@mantine/core");
var web_1 = require("@react-hookz/web");
var react_1 = require("motion/react");
var m = require("motion/react-m");
var react_2 = require("react");
var context_1 = require("../../context");
var hooks_1 = require("../../hooks");
var useDiagramCompareLayout_1 = require("../../hooks/useDiagramCompareLayout");
var _common_1 = require("../_common");
var ComparePanelControls_1 = require("./ComparePanelControls");
var DriftsSummary_1 = require("./DriftsSummary");
var variants = {
    initial: {
        opacity: 0,
        translateX: -20,
    },
    animate: {
        opacity: 1,
        translateX: 0,
    },
    exit: {
        opacity: 0,
        translateX: -20,
    },
};
exports.ComparePanel = (0, react_2.memo)(function () {
    var portalProps = (0, hooks_1.useMantinePortalProps)();
    var isMounted = (0, web_1.useIsMounted)();
    var enableCompareWithLatest = (0, context_1.useEnabledFeatures)().enableCompareWithLatest;
    var _a = (0, useDiagramCompareLayout_1.useDiagramCompareLayout)(), ctx = _a[0], ops = _a[1];
    var _b = (0, react_2.useState)(false), isProcessing = _b[0], setIsProcessing = _b[1];
    var resetProcessing = function () {
        // Defer setting setIsProcessing to false to allow for animation to play out
        // before the panel potentially unmounts due to no more drifts being present
        setTimeout(function () {
            if (isMounted()) {
                setIsProcessing(false);
            }
        }, 500);
    };
    var onApplyLatest = (0, hooks_1.useCallbackRef)(function (e) {
        if (!ctx.canApplyLatest || ctx.layout === 'auto') {
            window.alert('Cannot apply changes from latest version when using auto layout. Please switch to manual layout first.');
            return;
        }
        e.stopPropagation();
        setIsProcessing(true);
        setTimeout(function () {
            ops.applyLatestToManual();
            resetProcessing();
        }, 200);
    });
    var onResetManualLayout = (0, hooks_1.useCallbackRef)(function (e) {
        e.stopPropagation();
        setIsProcessing(true);
        setTimeout(function () {
            ops.resetManualLayout();
            resetProcessing();
        }, 200);
    });
    return (<react_1.AnimatePresence>
      {enableCompareWithLatest && (<>
          <m.div key={'ComparePanel'} layout="size" layoutDependency={ctx.drifts || ctx.layout} className={(0, patterns_1.hstack)({
                gap: '2',
                layerStyle: 'likec4.panel',
                position: 'relative',
                px: '2',
                py: '1',
                pl: '3',
                pointerEvents: 'all',
            })} variants={variants} initial="initial" animate="animate" exit="exit">
            <ComparePanelControls_1.ComparePanelControls />
          </m.div>
          <m.div key={'ListOfDrifts'} layout="size" layoutDependency={ctx.drifts || ctx.layout} variants={variants} initial="initial" animate="animate" exit="exit" className={(0, patterns_1.vstack)({
                gap: '4',
                layerStyle: 'likec4.panel',
                position: 'relative',
                p: '4',
                pointerEvents: 'all',
                height: 'auto',
                overflow: 'hidden',
                maxHeight: 'calc(100cqh - 180px)',
                '@/md': {
                    minWidth: '200px',
                },
            })}>
            <DriftsSummary_1.DriftsSummary />
            {ctx.canApplyLatest && (<>
                <m.div layout="position" className={(0, css_1.css)({ flex: '0' })}>
                  <core_1.Divider orientation="horizontal" size={'xs'} mb={'xs'}/>
                  <jsx_1.HStack>
                    <_common_1.Tooltip openDelay={100} disabled={ctx.layout !== 'auto'} label="Switch to manual layout to apply changes." {...portalProps}>
                      <core_1.Button loading={isProcessing} size="xs" color="orange" variant="light" onClick={onApplyLatest} disabled={ctx.layout === 'auto'}>
                        Apply changes
                      </core_1.Button>
                    </_common_1.Tooltip>
                    {!isProcessing && (<_common_1.Tooltip openDelay={100} disabled={ctx.layout !== 'manual'} label="Reset manual layout" {...portalProps}>
                        <core_1.Button hidden={isProcessing} size="xs" color="orange" variant="subtle" onClick={onResetManualLayout}>
                          Reset
                        </core_1.Button>
                      </_common_1.Tooltip>)}
                  </jsx_1.HStack>
                </m.div>
              </>)}
          </m.div>
        </>)}
    </react_1.AnimatePresence>);
});
exports.ComparePanel.displayName = 'ComparePanel';
