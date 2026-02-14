"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActiveWalkthroughControls = ActiveWalkthroughControls;
var css_1 = require("@likec4/styles/css");
var jsx_1 = require("@likec4/styles/jsx");
var core_1 = require("@mantine/core");
var icons_react_1 = require("@tabler/icons-react");
var react_1 = require("motion/react");
var m = require("motion/react-m");
var remeda_1 = require("remeda");
var hooks_1 = require("../../hooks");
var useDiagram_1 = require("../../hooks/useDiagram");
var DynamicViewControls_1 = require("./DynamicViewControls");
var PrevNextButton = core_1.Button.withProps({
    // Button is polymorphic, but we dont want it to inherit the motion props
    component: m.button,
    layout: 'position',
    whileTap: {
        scale: 0.95,
    },
    variant: 'light',
    size: 'xs',
    fw: '500',
});
var ParallelFrame = function () {
    var portalProps = (0, hooks_1.useMantinePortalProps)().portalProps;
    return (<core_1.Portal {...portalProps}>
      <jsx_1.Box css={{
            position: 'absolute',
            margin: '0',
            padding: '0',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            border: "2px solid",
            borderColor: 'likec4.walkthrough.parallelFrame',
            pointerEvents: 'none',
            md: {
                borderWidth: '4',
            },
        }}>
      </jsx_1.Box>
    </core_1.Portal>);
};
function ActiveWalkthroughControls() {
    var diagram = (0, useDiagram_1.useDiagram)();
    var _a = (0, useDiagram_1.useDiagramContext)(function (s) {
        var _a;
        var currentStepIndex = s.xyedges.findIndex(function (e) { var _a; return e.id === ((_a = s.activeWalkthrough) === null || _a === void 0 ? void 0 : _a.stepId); });
        return ({
            isParallel: (0, remeda_1.isTruthy)((_a = s.activeWalkthrough) === null || _a === void 0 ? void 0 : _a.parallelPrefix),
            hasNext: currentStepIndex < s.xyedges.length - 1,
            hasPrevious: currentStepIndex > 0,
            currentStep: currentStepIndex + 1,
            totalSteps: s.xyedges.length,
        });
    }), isParallel = _a.isParallel, hasNext = _a.hasNext, hasPrevious = _a.hasPrevious, currentStep = _a.currentStep, totalSteps = _a.totalSteps;
    return (<react_1.AnimatePresence propagate mode="popLayout">
      <DynamicViewControls_1.TriggerWalkthroughButton key="stop-walkthrough" variant="light" size="xs" color="orange" mr={'sm'} onClick={function (e) {
            e.stopPropagation();
            diagram.stopWalkthrough();
        }} rightSection={<icons_react_1.IconPlayerStopFilled size={10}/>}>
        Stop
      </DynamicViewControls_1.TriggerWalkthroughButton>

      <PrevNextButton key="prev" disabled={!hasPrevious} onClick={function () { return diagram.walkthroughStep('previous'); }} leftSection={<icons_react_1.IconPlayerSkipBackFilled size={10}/>}>
        Previous
      </PrevNextButton>

      <core_1.Badge key="step-badge" component={m.div} layout="position" size="md" radius="sm" 
    // fw={500}
    variant={isParallel ? 'gradient' : 'transparent'} gradient={{ from: 'red', to: 'orange', deg: 90 }} rightSection={<m.div className={(0, css_1.css)({
                fontSize: 'xxs',
                display: isParallel ? 'block' : 'none',
            })}>
            parallel
          </m.div>} className={(0, css_1.css)({
            alignItems: 'baseline',
        })}>
        {currentStep} / {totalSteps}
      </core_1.Badge>

      <PrevNextButton key="next" disabled={!hasNext} onClick={function () { return diagram.walkthroughStep('next'); }} rightSection={<icons_react_1.IconPlayerSkipForwardFilled size={10}/>}>
        Next
      </PrevNextButton>
      {isParallel && <ParallelFrame key="parallel-frame"/>}
    </react_1.AnimatePresence>);
}
