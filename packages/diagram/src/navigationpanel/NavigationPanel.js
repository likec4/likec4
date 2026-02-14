"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NavigationPanel = void 0;
var jsx_1 = require("@likec4/styles/jsx");
var patterns_1 = require("@likec4/styles/patterns");
var core_1 = require("@mantine/core");
var react_1 = require("@xstate/react");
var react_2 = require("motion/react");
var m = require("motion/react-m");
var react_3 = require("react");
var safeContext_1 = require("../hooks/safeContext");
var useCurrentView_1 = require("../hooks/useCurrentView");
var useCurrentViewModel_1 = require("../hooks/useCurrentViewModel");
var useDiagram_1 = require("../hooks/useDiagram");
var useMantinePortalProps_1 = require("../hooks/useMantinePortalProps");
var actor_1 = require("./actor");
var comparepanel_1 = require("./comparepanel");
var editorpanel_1 = require("./editorpanel");
var hooks_1 = require("./hooks");
var NavigationPanelControls_1 = require("./NavigationPanelControls");
var NavigationPanelDropdown_1 = require("./NavigationPanelDropdown");
var walkthrough_1 = require("./walkthrough");
var WalkthroughPanel_1 = require("./walkthrough/WalkthroughPanel");
exports.NavigationPanel = (0, react_3.memo)(function () {
    var diagram = (0, safeContext_1.useDiagram)();
    var view = (0, useCurrentView_1.useCurrentView)();
    var viewModel = (0, useCurrentViewModel_1.useOptionalCurrentViewModel)();
    var actorRef = (0, react_1.useActorRef)(actor_1.navigationPanelActorLogic, {
        input: {
            view: view,
            viewModel: viewModel,
        },
    });
    (0, react_3.useEffect)(function () {
        var subscription = actorRef.on('navigateTo', function (event) {
            diagram.navigateTo(event.viewId);
        });
        return function () { return subscription.unsubscribe(); };
    }, [actorRef, diagram]);
    (0, react_3.useEffect)(function () {
        actorRef.send({ type: 'update.inputs', inputs: { viewModel: viewModel, view: view } });
    }, [actorRef, viewModel, view]);
    return (<jsx_1.VStack css={{
            alignItems: 'flex-start',
            pointerEvents: 'none',
            position: 'absolute',
            top: '0',
            left: '0',
            margin: '0',
            width: '100%',
            gap: 'xxs',
            maxWidth: [
                'calc(100vw)',
                'calc(100cqw)',
            ],
            '@/sm': {
                margin: 'xs',
                gap: 'xs',
                width: 'max-content',
                maxWidth: [
                    'calc(100vw - 2 * {spacing.md})',
                    'calc(100cqw - 2 * {spacing.md})',
                ],
            },
            _print: {
                display: 'none',
            },
        }}>
      <hooks_1.NavigationPanelActorContextProvider value={actorRef}>
        <NavigationPanelImpl actor={actorRef}/>
        <comparepanel_1.ComparePanel />
        <WalkthroughPanel_1.WalkthroughPanel />
        <editorpanel_1.EditorPanel />
      </hooks_1.NavigationPanelActorContextProvider>
    </jsx_1.VStack>);
});
exports.NavigationPanel.displayName = 'NavigationPanel';
var stateHasActiveTag = function (state) { return state.hasTag('active'); };
var NavigationPanelImpl = function (_a) {
    var actor = _a.actor;
    var opened = (0, react_1.useSelector)(actor, stateHasActiveTag);
    var portalProps = (0, useMantinePortalProps_1.useMantinePortalProps)();
    return (<core_1.Popover offset={{
            mainAxis: 4,
        }} opened={opened} position="bottom-start" trapFocus={opened} {...portalProps} clickOutsideEvents={['pointerdown', 'mousedown', 'click']} onDismiss={function () { return actor.send({ type: 'dropdown.dismiss' }); }}>
      <NavigationPanelPopoverTarget actor={actor}/>
      {opened && <NavigationPanelDropdown_1.NavigationPanelDropdown />}
    </core_1.Popover>);
};
var NavigationPanelPopoverTarget = function (_a) {
    var actor = _a.actor;
    var isActiveWalkthrough = (0, useDiagram_1.useDiagramContext)(function (c) { return c.activeWalkthrough !== null; });
    return (<react_2.LayoutGroup>
      <core_1.PopoverTarget>
        <m.div layout layoutDependency={isActiveWalkthrough} className={(0, patterns_1.hstack)({
            layerStyle: 'likec4.panel',
            position: 'relative',
            gap: 'xs',
            cursor: 'pointer',
            pointerEvents: 'all',
            width: '100%',
        })} onMouseLeave={function () { return actor.send({ type: 'breadcrumbs.mouseLeave' }); }}>
          <react_2.AnimatePresence>
            {isActiveWalkthrough ? <walkthrough_1.ActiveWalkthroughControls /> : <NavigationPanelControls_1.NavigationPanelControls />}
          </react_2.AnimatePresence>
        </m.div>
      </core_1.PopoverTarget>
    </react_2.LayoutGroup>);
};
