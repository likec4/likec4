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
exports.NavigationPanel = void 0;
var css_1 = require("@likec4/styles/css");
var jsx_1 = require("@likec4/styles/jsx");
var recipes_1 = require("@likec4/styles/recipes");
var react_1 = require("motion/react");
var m = require("motion/react-m");
var react_2 = require("react");
var Logo_1 = require("./Logo");
var _a = (0, jsx_1.createStyleContext)(recipes_1.navigationPanel), withProvider = _a.withProvider, withContext = _a.withContext;
var shouldForwardProp = function (prop, variantKeys) {
    return !variantKeys.includes(prop) && ((0, react_1.isValidMotionProp)(prop) || !(0, jsx_1.isCssProperty)(prop));
};
var LogoButton = (0, react_2.forwardRef)(function (_a, ref) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return (<button {...props} ref={ref} className={(0, css_1.cx)('mantine-active', className)}>
      {/* These attributes are used by preset to conditionally render the icon */}
      <Logo_1.LogoIcon data-logo-icon/>
      <Logo_1.Logo data-logo-full/>
    </button>);
});
var Root = withProvider(m.div, 'root', {
    shouldForwardProp: shouldForwardProp,
});
var Body = withContext(m.div, 'body', {
    shouldForwardProp: shouldForwardProp,
});
var Logo = withContext(LogoButton, 'logo');
var Label = withContext(m.div, 'label', {
    shouldForwardProp: shouldForwardProp,
});
var Dropdown = withContext(m.div, 'dropdown', {
    shouldForwardProp: shouldForwardProp,
});
exports.NavigationPanel = {
    Root: Root,
    Body: Body,
    Logo: Logo,
    Label: Label,
    Dropdown: Dropdown,
};
