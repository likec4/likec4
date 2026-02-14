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
exports.ShadowRoot = void 0;
var hooks_1 = require("@mantine/hooks");
var react_1 = require("react");
var react_shadow_1 = require("react-shadow");
var remeda_1 = require("remeda");
var DefaultMantineProvider_1 = require("../context/DefaultMantineProvider");
var FramerMotionConfig_1 = require("../context/FramerMotionConfig");
var useCallbackRef_1 = require("../hooks/useCallbackRef");
var useId_1 = require("../hooks/useId");
var styles_css_1 = require("./styles.css");
var Root = react_shadow_1.default['div'];
function useShadowRootStyle(instanceId, keepAspectRatio) {
    if (keepAspectRatio === void 0) { keepAspectRatio = false; }
    if (keepAspectRatio === false) {
        return "\n:where([data-likec4-instance=\"".concat(instanceId, "\"]) {\n  display: block;\n  box-sizing: border-box;\n  border: 0 solid transparent;\n  background: transparent;\n  padding: 0;\n  margin: 0;\n  overflow: hidden;\n  width: 100%;\n  height: 100%;\n  min-width: 80px;\n  min-height: 80px;\n}\n  ").trim();
    }
    var width = Math.ceil(keepAspectRatio.width);
    var height = Math.ceil(keepAspectRatio.height);
    var isLandscape = width > height;
    return "\n:where([data-likec4-instance=\"".concat(instanceId, "\"]) {\n  display: block;\n  box-sizing: border-box;\n  border: 0 solid transparent;\n  background: transparent;\n  padding: 0;\n  overflow: hidden;\n  aspect-ratio: ").concat(width, " / ").concat(height, ";\n  ").concat(isLandscape ? '' : "\n  max-width: min(100%, var(--likec4-view-max-width, ".concat(width, "px));\n  margin-left: auto;\n  margin-right: auto;"), "\n  width: ").concat(isLandscape ? '100%' : 'auto', ";\n  height: ").concat(isLandscape ? 'auto' : '100%', ";\n  ").concat(isLandscape ? "min-width: 80px;" : "min-height: 80px;", "\n  max-height: min(100%, var(--likec4-view-max-height, ").concat(height, "px));\n}\n").trim();
}
exports.ShadowRoot = (0, react_1.forwardRef)(function (_a, ref) {
    var children = _a.children, theme = _a.theme, _b = _a.injectFontCss, injectFontCss = _b === void 0 ? true : _b, styleNonce = _a.styleNonce, explicitColorScheme = _a.colorScheme, _c = _a.keepAspectRatio, keepAspectRatio = _c === void 0 ? false : _c, props = __rest(_a, ["children", "theme", "injectFontCss", "styleNonce", "colorScheme", "keepAspectRatio"]);
    var colorScheme = (0, styles_css_1.useColorScheme)(explicitColorScheme);
    var id = (0, useId_1.useId)();
    var cssstyle = useShadowRootStyle(id, keepAspectRatio);
    var rootRef = (0, react_1.useRef)(null);
    var styleSheets = (0, styles_css_1.useBundledStyleSheet)(injectFontCss, styleNonce);
    var getRootElement = (0, useCallbackRef_1.useCallbackRef)(function () { var _a; return (_a = rootRef.current) !== null && _a !== void 0 ? _a : undefined; });
    var getStyleNonce = (0, useCallbackRef_1.useCallbackRef)(function () {
        if ((0, remeda_1.isDefined)(styleNonce)) {
            if (typeof styleNonce === 'string') {
                return styleNonce;
            }
            else if (typeof styleNonce === 'function') {
                return styleNonce();
            }
        }
        return '';
    });
    var nonce = (0, react_1.useState)(getStyleNonce)[0];
    return (<>
      <MemoizedStyle nonce={nonce} cssstyle={cssstyle}/>
      <Root ssr={false} {...props} styleSheets={styleSheets} data-likec4-instance={id}>
        <div ref={(0, hooks_1.useMergedRef)(rootRef, ref)} data-mantine-color-scheme={colorScheme} className={'likec4-shadow-root'}>
          <DefaultMantineProvider_1.DefaultMantineProvider defaultColorScheme={colorScheme} getRootElement={getRootElement} cssVariablesSelector={'.likec4-shadow-root'} withCssVariables={true} getStyleNonce={getStyleNonce} theme={theme} {...(explicitColorScheme && { forceColorScheme: explicitColorScheme })}>
            <FramerMotionConfig_1.FramerMotionConfig>
              {children}
            </FramerMotionConfig_1.FramerMotionConfig>
          </DefaultMantineProvider_1.DefaultMantineProvider>
        </div>
      </Root>
    </>);
});
/**
 * @internal Memoized styles gives a performance boost during development
 */
var MemoizedStyle = (0, react_1.memo)(function (_a) {
    var nonce = _a.nonce, cssstyle = _a.cssstyle;
    return (<style type="text/css" nonce={nonce} dangerouslySetInnerHTML={{ __html: cssstyle }}/>);
});
MemoizedStyle.displayName = 'MemoizedStyle';
