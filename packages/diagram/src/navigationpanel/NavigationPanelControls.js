"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NavigationPanelControls = void 0;
var model_1 = require("@likec4/core/model");
var css_1 = require("@likec4/styles/css");
var patterns_1 = require("@likec4/styles/patterns");
var core_1 = require("@mantine/core");
var react_1 = require("@xstate/react");
var fast_equals_1 = require("fast-equals");
var react_2 = require("motion/react");
var m = require("motion/react-m");
var react_3 = require("react");
var DiagramFeatures_1 = require("../context/DiagramFeatures");
var _common_1 = require("./_common");
var controls_1 = require("./controls");
var hooks_1 = require("./hooks");
var styles_css_1 = require("./styles.css");
var walkthrough_1 = require("./walkthrough");
var selectBreadcrumbs = function (_a) {
    var _b, _c, _d, _e, _f, _g;
    var context = _a.context;
    var view = context.view;
    var folder = (_b = context.viewModel) === null || _b === void 0 ? void 0 : _b.folder;
    return {
        folders: !folder || folder.isRoot ? [] : folder.breadcrumbs.map(function (s) { return ({
            folderPath: s.path,
            title: s.title,
        }); }),
        viewId: view.id,
        viewTitle: (_e = (_d = (_c = context.viewModel) === null || _c === void 0 ? void 0 : _c.title) !== null && _d !== void 0 ? _d : (view.title && (0, model_1.extractViewTitleFromPath)(view.title))) !== null && _e !== void 0 ? _e : 'Untitled View',
        isDynamicView: ((_g = (_f = context.viewModel) === null || _f === void 0 ? void 0 : _f._type) !== null && _g !== void 0 ? _g : view._type) === 'dynamic',
    };
};
exports.NavigationPanelControls = (0, react_3.memo)(function () {
    var actor = (0, hooks_1.useNavigationActor)();
    var _a = (0, DiagramFeatures_1.useEnabledFeatures)(), enableNavigationButtons = _a.enableNavigationButtons, enableDynamicViewWalkthrough = _a.enableDynamicViewWalkthrough, enableCompareWithLatest = _a.enableCompareWithLatest, enableSearch = _a.enableSearch;
    var _b = (0, react_1.useSelector)(actor.actorRef, selectBreadcrumbs, fast_equals_1.deepEqual), folders = _b.folders, viewTitle = _b.viewTitle, isDynamicView = _b.isDynamicView;
    var folderBreadcrumbs = folders.flatMap(function (_a, i) {
        var folderPath = _a.folderPath, title = _a.title;
        return [
            <core_1.UnstyledButton key={folderPath} component={m.button} className={(0, css_1.cx)((0, styles_css_1.breadcrumbTitle)({ dimmed: true, truncate: true }), 'mantine-active', (0, css_1.css)({
                    userSelect: 'none',
                    maxWidth: '200px',
                    display: {
                        base: 'none',
                        '@/md': 'block',
                    },
                }))} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} title={title} onMouseEnter={function () { return actor.send({ type: 'breadcrumbs.mouseEnter.folder', folderPath: folderPath }); }} onMouseLeave={function () { return actor.send({ type: 'breadcrumbs.mouseLeave.folder', folderPath: folderPath }); }} onClick={function (e) {
                    e.stopPropagation();
                    actor.send({ type: 'breadcrumbs.click.folder', folderPath: folderPath });
                }}>
      {title}
    </core_1.UnstyledButton>,
            <_common_1.BreadcrumbsSeparator key={"separator-".concat(i)}/>,
        ];
    });
    var viewBreadcrumb = (<core_1.UnstyledButton key={'view-title'} component={m.button} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={(0, css_1.cx)('mantine-active', (0, styles_css_1.breadcrumbTitle)({ truncate: true }), (0, css_1.css)({
            userSelect: 'none',
        }))} title={viewTitle} onMouseEnter={function () { return actor.send({ type: 'breadcrumbs.mouseEnter.viewtitle' }); }} onMouseLeave={function () { return actor.send({ type: 'breadcrumbs.mouseLeave.viewtitle' }); }} onClick={function (e) {
            e.stopPropagation();
            actor.send({ type: 'breadcrumbs.click.viewtitle' });
        }}>
      {viewTitle}
    </core_1.UnstyledButton>);
    return (<react_2.AnimatePresence propagate mode="popLayout">
      <controls_1.LogoButton key="logo-button"/>
      {enableNavigationButtons && <controls_1.NavigationButtons key="nav-buttons"/>}
      <m.div key="breadcrumbs" layout="position" className={(0, patterns_1.hstack)({
            gap: '1',
            flexShrink: 1,
            flexGrow: 1,
            overflow: 'hidden',
        })}>
        {folderBreadcrumbs}
        {viewBreadcrumb}
      </m.div>
      <m.div key="actions" layout="position" className={(0, patterns_1.hstack)({
            gap: '0.5',
            flexGrow: 0,
            _empty: {
                display: 'none',
            },
        })}>
        <controls_1.DetailsControls onOpen={function () { return actor.closeDropdown(); }}/>
        <controls_1.OpenSource />
        <controls_1.ToggleReadonly />
      </m.div>
      {enableDynamicViewWalkthrough && isDynamicView && <walkthrough_1.DynamicViewControls key="dynamic-view-controls"/>}
      {enableSearch && !enableCompareWithLatest && <controls_1.SearchControl key="search-control"/>}
      <controls_1.LayoutWarning key="outdated-manual-layout-warning"/>
    </react_2.AnimatePresence>);
});
exports.NavigationPanelControls.displayName = 'NavigationPanelControls';
