"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ViewsColumn = exports.NothingFound = void 0;
exports.ViewButton = ViewButton;
var types_1 = require("@likec4/core/types");
var css_1 = require("@likec4/styles/css");
var jsx_1 = require("@likec4/styles/jsx");
var core_1 = require("@mantine/core");
var icons_react_1 = require("@tabler/icons-react");
var m = require("motion/react-m");
var react_1 = require("react");
var remeda_1 = require("remeda");
var useCurrentView_1 = require("../../hooks/useCurrentView");
var useLikeC4Model_1 = require("../../hooks/useLikeC4Model");
var hooks_1 = require("../hooks");
var _shared_css_1 = require("./_shared.css");
var utils_1 = require("./utils");
var styles = require("./ViewsColumn.css");
var NothingFound = function () { return (<jsx_1.Box className={styles.emptyBoX}>
    Nothing found
  </jsx_1.Box>); };
exports.NothingFound = NothingFound;
var useFoundViews = function () {
    var currentViewId = (0, useCurrentView_1.useCurrentViewId)(); // subscribe to current view changes
    var likec4model = (0, useLikeC4Model_1.useLikeC4Model)();
    var search = (0, hooks_1.useNormalizedSearch)();
    return (0, react_1.useMemo)(function () {
        var views = __spreadArray([], likec4model.views(), true);
        if (search) {
            if (search.startsWith('kind:')) {
                views = [];
            }
            else {
                var searchTag_1 = search.startsWith('#') ? search.slice(1) : null;
                views = views.filter(function (view) {
                    var _a;
                    if (searchTag_1) {
                        return view.tags.some(function (tag) { return tag.toLocaleLowerCase().includes(searchTag_1); });
                    }
                    var desc = ((_a = (0, types_1.preferSummary)(view.$view)) === null || _a === void 0 ? void 0 : _a.md) || ' ';
                    return "".concat(view.id, " ").concat(view.title, " ").concat(desc).toLocaleLowerCase().includes(search);
                });
            }
        }
        return [views, search, currentViewId];
    }, [likec4model, search, currentViewId]);
};
exports.ViewsColumn = (0, react_1.memo)(function () {
    var ref = (0, react_1.useRef)(null);
    var _a = useFoundViews(), views = _a[0], search = _a[1], currentViewId = _a[2];
    return (<core_1.Stack ref={ref} renderRoot={function (props) { return <m.div layout {...props}/>; }} gap={8} data-likec4-search-views onKeyDown={function (e) {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                var maxY_1 = e.target.getBoundingClientRect().y;
                var elementButtons = (0, utils_1.queryAllFocusable)(ref.current, 'elements', '.likec4-element-button');
                var elementButton = elementButtons.length > 1
                    ? elementButtons.find(function (el, i, all) { return (0, utils_1.centerY)(el) > maxY_1 || i === all.length - 1; })
                    : null;
                elementButton !== null && elementButton !== void 0 ? elementButton : (elementButton = (0, remeda_1.first)(elementButtons));
                if (elementButton) {
                    e.stopPropagation();
                    elementButton.focus();
                }
                return;
            }
        }}>
      {views.length === 0 && <exports.NothingFound />}
      {views.length > 0 && (<core_1.VisuallyHidden>
          <core_1.UnstyledButton data-likec4-view tabIndex={-1} onFocus={function (e) {
                e.stopPropagation();
                (0, utils_1.moveFocusToSearchInput)(ref.current);
            }}/>
        </core_1.VisuallyHidden>)}
      {views.map(function (view, i) { return (<m.div layoutId={"@view".concat(view.id)} key={view.id}>
          <ViewButton view={view} currentViewId={currentViewId} search={search} tabIndex={i === 0 ? 0 : -1}/>
        </m.div>); })}
    </core_1.Stack>);
});
var btn = (0, _shared_css_1.buttonsva)();
function ViewButton(_a) {
    var className = _a.className, view = _a.view, _b = _a.loop, loop = _b === void 0 ? false : _b, search = _a.search, focusOnElement = _a.focusOnElement, currentViewId = _a.currentViewId, props = __rest(_a, ["className", "view", "loop", "search", "focusOnElement", "currentViewId"]);
    var searchActorRef = (0, hooks_1.useSearchActor)();
    var nextViewId = view.id;
    var isCurrentView = nextViewId === currentViewId;
    var navigate = function () {
        searchActorRef.send({
            type: 'navigate.to',
            viewId: nextViewId,
            focusOnElement: focusOnElement,
        });
    };
    return (<core_1.UnstyledButton {...props} className={(0, css_1.cx)(btn.root, 'group', styles.focusable, styles.viewButton, className)} data-likec4-view={view.id} {...(isCurrentView && !focusOnElement) && { 'data-disabled': true }} onClick={function (e) {
            e.stopPropagation();
            navigate();
        }} onKeyDown={(0, core_1.createScopedKeydownHandler)({
            siblingSelector: '[data-likec4-view]',
            parentSelector: '[data-likec4-search-views]',
            activateOnFocus: false,
            loop: loop,
            orientation: 'vertical',
            onKeyDown: function (e) {
                if (e.nativeEvent.code === 'Space') {
                    e.stopPropagation();
                    navigate();
                }
            },
        })}>
      <core_1.ThemeIcon variant="transparent" className={btn.icon}>
        {view.isDeploymentView()
            ? <icons_react_1.IconStack2 stroke={1.8}/>
            : <icons_react_1.IconZoomScan stroke={1.8}/>}
      </core_1.ThemeIcon>
      <jsx_1.Box style={{ flexGrow: 1 }}>
        <core_1.Group gap={'xs'} wrap="nowrap" align="center">
          <core_1.Highlight component="div" highlight={search} className={btn.title}>
            {view.titleOrUntitled}
          </core_1.Highlight>
          {isCurrentView && <core_1.Badge size="xs" fz={9} radius={'sm'}>current</core_1.Badge>}
        </core_1.Group>
        <core_1.Highlight highlight={view.description.nonEmpty ? search : ''} component="div" className={btn.description} lineClamp={1}>
          {view.description.text || 'No description'}
        </core_1.Highlight>
      </jsx_1.Box>
    </core_1.UnstyledButton>);
}
