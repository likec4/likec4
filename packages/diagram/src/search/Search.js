"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Search = void 0;
var css_1 = require("@likec4/styles/css");
var jsx_1 = require("@likec4/styles/jsx");
var core_1 = require("@mantine/core");
var hooks_1 = require("@mantine/hooks");
var web_1 = require("@react-hookz/web");
var react_1 = require("@xstate/react");
var react_2 = require("motion/react");
var react_3 = require("react");
var remeda_1 = require("remeda");
var xstate_1 = require("xstate");
var useCallbackRef_1 = require("../hooks/useCallbackRef");
var useSearchActor_1 = require("../hooks/useSearchActor");
var Overlay_1 = require("../overlays/overlay/Overlay");
var ElementsColumn_1 = require("./components/ElementsColumn");
var PickView_1 = require("./components/PickView");
var SearchByTags_1 = require("./components/SearchByTags");
var SearchInput_1 = require("./components/SearchInput");
var utils_1 = require("./components/utils");
var ViewsColum_1 = require("./components/ViewsColum");
var dialog = (0, css_1.css)({
    backgroundColor: "[rgb(34 34 34 / var(--_opacity, 95%))]",
    _light: {
        backgroundColor: "[rgb(250 250 250 / var(--_opacity, 95%))]",
    },
    backdropFilter: 'auto',
    backdropBlur: 'var(--_blur, 10px)',
    //   base: `[rgb(34 34 34 / var(${backdropOpacity}))]`,
    //   _light: `[rgb(255 255 255/ var(${backdropOpacity}))]`,
    // },
});
var body = (0, css_1.css)({
    // containerName: 'likec4-search',
    // containerType: 'size',
    // position: 'fixed',
    // zIndex: 901,
    // top: '0',
    // left: '0',
    width: '100%',
    height: '100%',
    maxHeight: '100vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'stretch',
    gap: 'sm',
    paddingTop: '[20px]',
    paddingLeft: 'md',
    paddingRight: 'md',
    paddingBottom: 'sm',
    background: 'transparent',
    // backgroundColor: {
    //   _dark: `[rgb(34 34 34 / 0.95)]`,
    //   _light: `[rgb(255 255 255/ 0.95)]`,
    // },
});
var scrollArea = (0, css_1.css)({
    height: [
        '100%',
        '100cqh',
    ],
    '& .mantine-ScrollArea-viewport': {
        minHeight: '100%',
        '& > div': {
            minHeight: '100%',
            height: '100%',
        },
    },
});
var selectIsOpened = function (s) {
    try {
        return s.status === 'active' && (s.value === 'opened' || s.value === 'pickView');
    }
    catch (e) {
        console.error(e);
        return false;
    }
};
exports.Search = (0, react_3.memo)(function () {
    var searchActorRef = (0, useSearchActor_1.useSearchActorRef)();
    var emptyActorRef = (0, react_3.useRef)((0, xstate_1.createEmptyActor)());
    var isOpened = (0, react_1.useSelector)(searchActorRef !== null && searchActorRef !== void 0 ? searchActorRef : emptyActorRef.current, selectIsOpened);
    var close = (0, useCallbackRef_1.useCallbackRef)(function () {
        searchActorRef === null || searchActorRef === void 0 ? void 0 : searchActorRef.send({ type: 'close' });
    });
    (0, hooks_1.useHotkeys)((0, react_3.useMemo)(function () {
        var openSearch = function () { return searchActorRef === null || searchActorRef === void 0 ? void 0 : searchActorRef.send({ type: 'open' }); };
        return searchActorRef ?
            [
                ['mod+k', openSearch, {
                        preventDefault: true,
                    }],
                ['mod+f', openSearch, {
                        preventDefault: true,
                    }],
            ] :
            [];
    }, [searchActorRef]));
    return (<react_2.AnimatePresence>
      {searchActorRef && isOpened && (<Overlay_1.Overlay fullscreen withBackdrop={false} backdrop={{
                opacity: 0.9,
            }} classes={{
                dialog: dialog,
                body: body,
            }} openDelay={0} onClose={close} data-likec4-search="true">
          <SearchOverlayBody searchActorRef={searchActorRef}/>
        </Overlay_1.Overlay>)}
    </react_2.AnimatePresence>);
});
exports.Search.displayName = 'Search';
var selectPickViewFor = function (s) { return s.context.pickViewFor; };
var SearchOverlayBody = (0, react_3.memo)(function (_a) {
    var searchActorRef = _a.searchActorRef;
    var ref = (0, react_3.useRef)(null);
    var pickViewFor = (0, react_1.useSelector)(searchActorRef, selectPickViewFor);
    (0, web_1.useTimeoutEffect)(function () {
        if ((0, remeda_1.isTruthy)(searchActorRef.getSnapshot().context.openedWithSearch)) {
            (0, utils_1.focusToFirstFoundElement)(ref.current);
        }
    }, 150);
    var _b = (0, react_2.usePresence)(), isPresent = _b[0], safeToRemove = _b[1];
    (0, react_3.useEffect)(function () {
        if (isPresent) {
            return;
        }
        safeToRemove();
        try {
            // Actor might be stopped, so we need to catch the error
            searchActorRef.send({ type: 'animation.presence.end' });
        }
        catch (e) {
            console.debug('SearchOverlayBody: animation.presence.end failed', e);
        }
    }, [isPresent, searchActorRef, safeToRemove]);
    return (<jsx_1.Box ref={ref} display={'contents'}>
      <core_1.Group className={'group'} wrap="nowrap" onClick={function (e) {
            e.stopPropagation();
            (0, utils_1.moveFocusToSearchInput)(ref.current);
        }}>
        <jsx_1.VStack flex={1} px={'sm'}>
          <SearchInput_1.LikeC4SearchInput />
          <SearchByTags_1.SearchByTags />
        </jsx_1.VStack>
      </core_1.Group>
      <core_1.Grid>
        <core_1.GridCol span={6}>
          <core_1.Title component={'div'} order={6} c="dimmed" pl="sm">Elements</core_1.Title>
        </core_1.GridCol>
        <core_1.GridCol span={6}>
          <core_1.Title component={'div'} order={6} c="dimmed" pl="sm">Views</core_1.Title>
        </core_1.GridCol>
      </core_1.Grid>
      <core_1.Grid className={(0, css_1.css)({
            containerName: 'likec4-search-elements',
            containerType: 'size',
            overflow: 'hidden',
            flexGrow: 1,
        })}>
        <core_1.GridCol span={6}>
          <core_1.ScrollArea type="scroll" className={scrollArea} pr="xs" scrollbars="y">
            <react_2.LayoutGroup id="likec4-search-elements">
              <react_3.Suspense>
                <ElementsColumn_1.ElementsColumn />
              </react_3.Suspense>
            </react_2.LayoutGroup>
          </core_1.ScrollArea>
        </core_1.GridCol>
        <core_1.GridCol span={6}>
          <core_1.ScrollArea type="scroll" className={scrollArea} pr="xs" scrollbars="y">
            <react_3.Suspense>
              <react_2.LayoutGroup id="likec4-search-views">
                <ViewsColum_1.ViewsColumn />
              </react_2.LayoutGroup>
            </react_3.Suspense>
          </core_1.ScrollArea>
        </core_1.GridCol>
      </core_1.Grid>
      {pickViewFor && <PickView_1.PickView searchActorRef={searchActorRef} elementFqn={pickViewFor}/>}
    </jsx_1.Box>);
});
