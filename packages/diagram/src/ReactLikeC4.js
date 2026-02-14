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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReactLikeC4 = ReactLikeC4;
var css_1 = require("@likec4/styles/css");
var ViewNotFound_1 = require("./components/ViewNotFound");
var useLikeC4Model_1 = require("./hooks/useLikeC4Model");
var LikeC4Diagram_1 = require("./LikeC4Diagram");
var ShadowRoot_1 = require("./shadowroot/ShadowRoot");
var utils_1 = require("./utils");
/**
 * Ready-to-use component to display embedded LikeC4 view, same as {@link LikeC4View}
 * But provides more control over the diagram
 *
 * Component is wrapped in ShadowRoot to isolate styles.
 */
function ReactLikeC4(_a) {
    var _b, _c, _d;
    var viewId = _a.viewId, _e = _a.layoutType, initialLayoutType = _e === void 0 ? 'manual' : _e, className = _a.className, colorScheme = _a.colorScheme, _f = _a.injectFontCss, injectFontCss = _f === void 0 ? true : _f, enableNotations = _a.enableNotations, keepAspectRatio = _a.keepAspectRatio, style = _a.style, mantineTheme = _a.mantineTheme, styleNonce = _a.styleNonce, props = __rest(_a, ["viewId", "layoutType", "className", "colorScheme", "injectFontCss", "enableNotations", "keepAspectRatio", "style", "mantineTheme", "styleNonce"]);
    var likec4model = (0, useLikeC4Model_1.useOptionalLikeC4Model)();
    if (!likec4model) {
        return (<ViewNotFound_1.ErrorMessage>
        LikeC4Model not found. Make sure you provided LikeC4ModelProvider.
      </ViewNotFound_1.ErrorMessage>);
    }
    var viewModel = likec4model.findView(viewId);
    if (!viewModel) {
        return <ViewNotFound_1.ViewNotFound viewId={viewId}/>;
    }
    if (!viewModel.isLayouted()) {
        return (<ViewNotFound_1.ErrorMessage>
        LikeC4 View "${viewId}" is not layouted. Make sure you have LikeC4ModelProvider with layouted model.
      </ViewNotFound_1.ErrorMessage>);
    }
    var view = initialLayoutType === 'manual'
        ? viewModel.$layouted
        : viewModel.$view;
    var bounds = (0, utils_1.pickViewBounds)(view, props.dynamicViewVariant);
    var hasNotations = !!enableNotations && ((_d = (_c = (_b = view.notation) === null || _b === void 0 ? void 0 : _b.nodes) === null || _c === void 0 ? void 0 : _c.length) !== null && _d !== void 0 ? _d : 0) > 0;
    return (<ShadowRoot_1.ShadowRoot injectFontCss={injectFontCss} theme={mantineTheme} colorScheme={colorScheme} styleNonce={styleNonce} keepAspectRatio={keepAspectRatio ? bounds : false} className={(0, css_1.cx)('likec4-view', className)} style={style}>
      <LikeC4Diagram_1.LikeC4Diagram view={view} enableNotations={hasNotations} {...props}/>
    </ShadowRoot_1.ShadowRoot>);
}
