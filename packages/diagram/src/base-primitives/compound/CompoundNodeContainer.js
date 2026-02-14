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
exports.CompoundNodeContainer = CompoundNodeContainer;
var css_1 = require("@likec4/styles/css");
var recipes_1 = require("@likec4/styles/recipes");
var m = require("motion/react-m");
var remeda_1 = require("remeda");
var const_1 = require("../../base/const");
var useLikeC4Styles_1 = require("../../hooks/useLikeC4Styles");
function CompoundNodeContainer(_a) {
    var _b;
    var _c, _d, _e;
    var _f = _a.nodeProps.data, _g = _f.hovered, isHovered = _g === void 0 ? false : _g, _h = _f.dimmed, isDimmed = _h === void 0 ? false : _h, data = __rest(_f, ["hovered", "dimmed"]), className = _a.className, children = _a.children, style = _a.style, rest = __rest(_a, ["nodeProps", "className", "children", "style"]);
    var styles = (0, useLikeC4Styles_1.useLikeC4Styles)();
    var opacity = (0, remeda_1.clamp)((_c = data.style.opacity) !== null && _c !== void 0 ? _c : 100, {
        min: 0,
        max: 100,
    });
    var isTransparent = opacity < 98;
    var MIN_OPACITY = 50;
    var borderOpacity = MIN_OPACITY + (0, remeda_1.clamp)((100 - MIN_OPACITY) * (opacity / 100), {
        min: 0,
        max: 100 - MIN_OPACITY,
    });
    var compoundClass = (0, recipes_1.compoundNode)({
        isTransparent: isTransparent,
        inverseColor: opacity < 70,
        borderStyle: (_d = data.style.border) !== null && _d !== void 0 ? _d : (isTransparent ? styles.defaults.group.border : 'none'),
    });
    var depth = (0, remeda_1.clamp)((_e = data.depth) !== null && _e !== void 0 ? _e : 1, {
        min: 1,
        max: const_1.MAX_COMPOUND_DEPTH,
    });
    return (<m.div className={(0, css_1.cx)(compoundClass, className)} initial={false} data-likec4-hovered={isHovered} data-likec4-color={data.color} data-compound-depth={depth} {...isDimmed !== false && {
        'data-likec4-dimmed': isDimmed,
    }} tabIndex={-1} animate={_b = {},
            _b['--_border-transparency'] = "".concat(borderOpacity, "%"),
            _b['--_compound-transparency'] = "".concat(opacity, "%"),
            _b} style={style} {...rest}>
      {children}
    </m.div>);
}
