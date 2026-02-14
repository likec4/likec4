"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.cssInteractive = void 0;
exports.useBundledStyleSheet = useBundledStyleSheet;
exports.useColorScheme = useColorScheme;
var css_1 = require("@likec4/styles/css");
var hooks_1 = require("@mantine/hooks");
var web_1 = require("@react-hookz/web");
var react_1 = require("react");
var remeda_1 = require("remeda");
var hooks_2 = require("../hooks");
var styles_font_css_inline_1 = require("../styles-font.css?inline");
var styles_css_inline_1 = require("../styles.css?inline");
exports.cssInteractive = (0, css_1.css)((_a = {
        cursor: 'pointer'
    },
    _a['--mantine-cursor-pointer'] = 'pointer',
    _a['& :where(.likec4-diagram, .likec4-compound-node, .likec4-element-node)'] = {
        cursor: 'pointer',
    },
    _a));
function useBundledStyleSheet(injectFontCss, styleNonce) {
    var _a = (0, react_1.useState)([]), styleSheets = _a[0], setStyleSheets = _a[1];
    (0, web_1.useIsomorphicLayoutEffect)(function () {
        // Inject font CSS into document head once
        // DO NOT inject into shadow root to avoid FOUC
        if (injectFontCss && !document.querySelector("style[data-likec4-font]")) {
            var style = document.createElement('style');
            style.setAttribute('type', 'text/css');
            style.setAttribute('data-likec4-font', '');
            if ((0, remeda_1.isString)(styleNonce)) {
                style.setAttribute('nonce', styleNonce);
            }
            if ((0, remeda_1.isFunction)(styleNonce)) {
                style.setAttribute('nonce', styleNonce());
            }
            style.appendChild(document.createTextNode(styles_font_css_inline_1.default));
            document.head.appendChild(style);
        }
    }, [injectFontCss]);
    (0, web_1.useIsomorphicLayoutEffect)(function () {
        var css = new CSSStyleSheet();
        css.replaceSync(styles_css_inline_1.default
            .replaceAll(':where(:root,:host)', ".likec4-shadow-root")
            .replaceAll(':root', ".likec4-shadow-root")
            /**
             * replace only top-level body selectors, for example
             * `body { }` should be replaced with `.likec4-shadow-root { }`
             * but `.likec4-overlay-body { }` - not
             */
            .replaceAll(/(?<![-_])\bbody\s*\{/g, ".likec4-shadow-root{"));
        setStyleSheets([css]);
        return function () {
            css.replaceSync('');
        };
    }, [styles_css_inline_1.default]);
    return styleSheets;
}
var getComputedColorScheme = function () {
    var _a;
    try {
        var htmlScheme = (_a = window.getComputedStyle(document.documentElement).colorScheme) !== null && _a !== void 0 ? _a : '';
        var colorScheme = (0, remeda_1.first)(htmlScheme.split(' '));
        if (colorScheme === 'light' || colorScheme === 'dark') {
            return colorScheme;
        }
    }
    catch (_b) {
        // noop
    }
    return null;
};
function useColorScheme(explicit) {
    var _a;
    var preferred = (0, hooks_1.useColorScheme)();
    var _b = (0, react_1.useState)(getComputedColorScheme), computed = _b[0], setComputed = _b[1];
    (0, hooks_1.useMutationObserver)((0, hooks_2.useCallbackRef)(function () { return setComputed(getComputedColorScheme); }), {
        attributes: true,
        childList: false,
        subtree: false,
    }, function () { return document.documentElement; });
    return (_a = explicit !== null && explicit !== void 0 ? explicit : computed) !== null && _a !== void 0 ? _a : preferred;
}
