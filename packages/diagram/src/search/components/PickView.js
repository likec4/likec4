"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PickView = PickView;
var core_1 = require("@mantine/core");
var hooks_1 = require("@mantine/hooks");
var icons_react_1 = require("@tabler/icons-react");
var m = require("motion/react-m");
var useCurrentView_1 = require("../../hooks/useCurrentView");
var useLikeC4Model_1 = require("../../hooks/useLikeC4Model");
var styles = require("./styles.css");
var ViewsColum_1 = require("./ViewsColum");
function PickView(_a) {
    var searchActorRef = _a.searchActorRef, elementFqn = _a.elementFqn;
    var currentViewId = (0, useCurrentView_1.useCurrentViewId)();
    var element = (0, useLikeC4Model_1.useLikeC4Model)().element(elementFqn);
    var scoped = [];
    var others = [];
    for (var _i = 0, _b = element.views(); _i < _b.length; _i++) {
        var view = _b[_i];
        if (view.viewOf === element) {
            scoped.push(view);
        }
        else {
            others.push(view);
        }
    }
    var closePickView = function () {
        searchActorRef.send({ type: 'pickview.close' });
    };
    (0, hooks_1.useWindowEvent)('keydown', (0, hooks_1.useCallbackRef)(function (event) {
        try {
            if (event.key === 'Escape') {
                event.stopPropagation();
                event.preventDefault();
                closePickView();
            }
        }
        catch (e) {
            console.warn(e);
        }
    }), {
        capture: true,
    });
    return (<>
      <m.div key="pickview-backdrop" className={styles.pickviewBackdrop} onClick={function (e) {
            e.stopPropagation();
            closePickView();
        }}>
      </m.div>
      <core_1.FocusTrap>
        <m.div key="pickview" initial={{
            opacity: 0,
            scale: 0.95,
            originY: 0,
            translateX: '-50%',
            translateY: -20,
        }} animate={{
            opacity: 1,
            scale: 1,
            translateY: 0,
        }} exit={{
            opacity: 0,
            scale: 0.98,
            translateY: -20,
            transition: {
                duration: 0.1,
            },
        }} className={styles.pickview} data-likec4-search-views>
          <core_1.Group px="sm" py="md" justify="space-between">
            <core_1.Title order={2} lh={1}>Select view</core_1.Title>
            <core_1.ActionIcon size={'md'} variant="default" onClick={function (e) {
            e.stopPropagation();
            closePickView();
        }}>
              <icons_react_1.IconX />
            </core_1.ActionIcon>
          </core_1.Group>
          <core_1.ScrollAreaAutosize mah={'calc(100vh - 110px)'} type="never">
            {scoped.length > 0 && (<core_1.Stack gap={'sm'} px={'sm'} className={styles.pickviewGroup}>
                <core_1.Title order={6} c={'dimmed'}>scoped views of the element</core_1.Title>
                {scoped.map(function (view, i) { return (<ViewsColum_1.ViewButton key={view.id} view={view} currentViewId={currentViewId} search={''} loop focusOnElement={elementFqn} mod={{
                    autofocus: i === 0,
                }}/>); })}
              </core_1.Stack>)}

            {others.length > 0 && (<core_1.Stack gap={'sm'} px={'sm'} className={styles.pickviewGroup}>
                <core_1.Title order={6} c={'dimmed'}>views including this element</core_1.Title>
                {others.map(function (view, i) { return (<ViewsColum_1.ViewButton key={view.id} view={view} currentViewId={currentViewId} search={''} loop focusOnElement={elementFqn} mod={{
                    autofocus: i === 0 && scoped.length === 0,
                }}/>); })}
              </core_1.Stack>)}
          </core_1.ScrollAreaAutosize>
        </m.div>
      </core_1.FocusTrap>
    </>);
}
