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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LikeC4View = LikeC4View;
var css_1 = require("@likec4/styles/css");
var jsx_1 = require("@likec4/styles/jsx");
var core_1 = require("@mantine/core");
var icons_react_1 = require("@tabler/icons-react");
var react_1 = require("motion/react");
var react_2 = require("react");
var remeda_1 = require("remeda");
var const_1 = require("./base/const");
var ViewNotFound_1 = require("./components/ViewNotFound");
var useCallbackRef_1 = require("./hooks/useCallbackRef");
var useLikeC4Model_1 = require("./hooks/useLikeC4Model");
var LikeC4Diagram_1 = require("./LikeC4Diagram");
var Overlay_1 = require("./overlays/overlay/Overlay");
var ShadowRoot_1 = require("./shadowroot/ShadowRoot");
var utils_1 = require("./utils");
var view_bounds_1 = require("./utils/view-bounds");
var cssInteractive = (0, css_1.css)((_a = {
        cursor: 'pointer'
    },
    _a['--mantine-cursor-pointer'] = 'pointer',
    _a['& :where(.likec4-diagram, .likec4-compound-node, .likec4-element-node)'] = {
        cursor: 'pointer',
    },
    _a));
/**
 * Ready-to-use component to display embedded LikeC4 view,
 * OnClick allows to browse the model.
 *
 * {@link ReactLikeC4} gives you more control.
 *
 * Component is wrapped in ShadowRoot to isolate styles.
 */
function LikeC4View(_a) {
    var _b, _c, _d, _e, _f, _g, _h;
    var viewId = _a.viewId, className = _a.className, _j = _a.pannable, pannable = _j === void 0 ? false : _j, _k = _a.zoomable, zoomable = _k === void 0 ? false : _k, _l = _a.keepAspectRatio, keepAspectRatio = _l === void 0 ? true : _l, colorScheme = _a.colorScheme, _m = _a.injectFontCss, injectFontCss = _m === void 0 ? true : _m, _o = _a.controls, controls = _o === void 0 ? false : _o, _p = _a.layoutType, initialLayoutType = _p === void 0 ? 'manual' : _p, _q = _a.background, background = _q === void 0 ? 'transparent' : _q, _r = _a.browser, browser = _r === void 0 ? true : _r, _s = _a.showNavigationButtons, showNavigationButtons = _s === void 0 ? false : _s, enableNotations = _a.enableNotations, _t = _a.enableFocusMode, enableFocusMode = _t === void 0 ? false : _t, _u = _a.enableDynamicViewWalkthrough, enableDynamicViewWalkthrough = _u === void 0 ? false : _u, _v = _a.enableElementDetails, enableElementDetails = _v === void 0 ? false : _v, _w = _a.enableRelationshipDetails, enableRelationshipDetails = _w === void 0 ? false : _w, _x = _a.enableRelationshipBrowser, enableRelationshipBrowser = _x === void 0 ? enableRelationshipDetails : _x, _y = _a.enableNotes, enableNotes = _y === void 0 ? false : _y, _z = _a.reduceGraphics, reduceGraphics = _z === void 0 ? 'auto' : _z, mantineTheme = _a.mantineTheme, styleNonce = _a.styleNonce, style = _a.style, reactFlowProps = _a.reactFlowProps, renderNodes = _a.renderNodes, children = _a.children, props = __rest(_a, ["viewId", "className", "pannable", "zoomable", "keepAspectRatio", "colorScheme", "injectFontCss", "controls", "layoutType", "background", "browser", "showNavigationButtons", "enableNotations", "enableFocusMode", "enableDynamicViewWalkthrough", "enableElementDetails", "enableRelationshipDetails", "enableRelationshipBrowser", "enableNotes", "reduceGraphics", "mantineTheme", "styleNonce", "style", "reactFlowProps", "renderNodes", "children"]);
    var rootRef = (0, react_2.useRef)(null);
    var likec4model = (0, useLikeC4Model_1.useOptionalLikeC4Model)();
    var _0 = (0, react_2.useState)(initialLayoutType), layoutType = _0[0], setLayoutType = _0[1];
    var _1 = (0, react_2.useState)(null), browserViewId = _1[0], _onNavigateTo = _1[1];
    var onNavigateTo = (0, useCallbackRef_1.useCallbackRef)(function (viewId) {
        // reset layout type if we navigate to a different view
        if (viewId && viewId !== browserViewId) {
            setLayoutType(initialLayoutType);
        }
        _onNavigateTo(viewId);
    });
    var onNavigateToThisView = (0, useCallbackRef_1.useCallbackRef)(function () {
        onNavigateTo(viewId);
    });
    var closeBrowser = (0, useCallbackRef_1.useCallbackRef)(function () {
        onNavigateTo(null);
    });
    if (!likec4model) {
        return (<ViewNotFound_1.ErrorMessage>
        LikeC4Model not found. Make sure you have LikeC4ModelProvider in the component tree.
      </ViewNotFound_1.ErrorMessage>);
    }
    var viewModel = likec4model.findView(viewId);
    if (!viewModel) {
        return (<ViewNotFound_1.ErrorMessage>
        LikeC4 View <code>{viewId}</code> not found in LikeC4Model.<br />
        Available views: {__spreadArray([], likec4model.views(), true).map(function (v) { return v.id; }).join(', ')}
      </ViewNotFound_1.ErrorMessage>);
    }
    if (!viewModel.isLayouted()) {
        return (<ViewNotFound_1.ErrorMessage>
        LikeC4 View <code>{viewId}</code> is not layouted.<br />
        Make sure you have LikeC4ModelProvider with layouted model.
      </ViewNotFound_1.ErrorMessage>);
    }
    var view = initialLayoutType === 'manual'
        ? viewModel.$layouted
        : viewModel.$view;
    var browserViewModel = browserViewId ? likec4model.findView(browserViewId) : null;
    var browserView = layoutType === 'manual'
        ? browserViewModel === null || browserViewModel === void 0 ? void 0 : browserViewModel.$layouted
        : browserViewModel === null || browserViewModel === void 0 ? void 0 : browserViewModel.$view;
    var hasNotations = !!enableNotations && ((_d = (_c = (_b = view.notation) === null || _b === void 0 ? void 0 : _b.nodes) === null || _c === void 0 ? void 0 : _c.length) !== null && _d !== void 0 ? _d : 0) > 0;
    var browserViewHasNotations = ((_g = (_f = (_e = browserView === null || browserView === void 0 ? void 0 : browserView.notation) === null || _e === void 0 ? void 0 : _e.nodes) === null || _f === void 0 ? void 0 : _f.length) !== null && _g !== void 0 ? _g : 0) > 0;
    var isBrowserEnabled = browser !== false;
    var browserProps = (0, remeda_1.isBoolean)(browser) ? {} : browser;
    var bounds = (0, view_bounds_1.pickViewBounds)(view, props.dynamicViewVariant);
    var root = rootRef.current ? { root: rootRef.current } : undefined;
    return (<ShadowRoot_1.ShadowRoot ref={rootRef} injectFontCss={injectFontCss} theme={mantineTheme} colorScheme={colorScheme} styleNonce={styleNonce} keepAspectRatio={keepAspectRatio ? bounds : false} className={(0, css_1.cx)('likec4-view', className)} style={style}>
      <LikeC4Diagram_1.LikeC4Diagram view={view} pannable={pannable} zoomable={zoomable} background={background} fitView fitViewPadding={const_1.FitViewPaddings.default} enableNotations={hasNotations} enableDynamicViewWalkthrough={enableDynamicViewWalkthrough} showNavigationButtons={showNavigationButtons} enableCompareWithLatest={false} enableFocusMode={enableFocusMode} enableRelationshipDetails={enableRelationshipDetails} enableElementDetails={enableElementDetails} enableRelationshipBrowser={enableRelationshipBrowser} enableElementTags={false} enableNotes={enableNotes} controls={controls} reduceGraphics={reduceGraphics} className={(0, css_1.cx)('likec4-static-view', isBrowserEnabled && cssInteractive)} 
    // We may have multiple embedded views on the same page
    // so we don't want enable search and hotkeys
    enableSearch={false} {...isBrowserEnabled && {
        onCanvasClick: onNavigateToThisView,
        onNodeClick: onNavigateToThisView,
    }} reactFlowProps={reactFlowProps} renderNodes={renderNodes} {...props}>
        {children}
      </LikeC4Diagram_1.LikeC4Diagram>
      <react_1.AnimatePresence {...root}>
        {browserView && (<Overlay_1.Overlay openDelay={0} onClose={closeBrowser}>
            <LikeC4Diagram_1.LikeC4Diagram view={browserView} pannable zoomable background="dots" onNavigateTo={onNavigateTo} showNavigationButtons enableDynamicViewWalkthrough enableFocusMode enableRelationshipBrowser enableElementDetails enableRelationshipDetails enableSearch enableElementTags enableNotes enableCompareWithLatest controls fitView {...props} fitViewPadding={const_1.FitViewPaddings.withControls} {...browserProps} enableNotations={browserViewHasNotations && ((_h = browserProps.enableNotations) !== null && _h !== void 0 ? _h : true)} renderNodes={renderNodes} onLayoutTypeChange={setLayoutType}/>
            <jsx_1.Box pos="absolute" top={'4'} right={'4'} zIndex={'999'} onClick={utils_1.stopPropagation}>
              <core_1.ActionIcon variant="default" color="gray" onClick={closeBrowser}>
                <icons_react_1.IconX />
              </core_1.ActionIcon>
            </jsx_1.Box>
          </Overlay_1.Overlay>)}
      </react_1.AnimatePresence>
    </ShadowRoot_1.ShadowRoot>);
}
