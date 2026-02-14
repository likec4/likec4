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
exports.ElementNodeContainer = void 0;
var types_1 = require("@likec4/core/types");
var css_1 = require("@likec4/styles/css");
var recipes_1 = require("@likec4/styles/recipes");
var m = require("motion/react-m");
var react_1 = require("react");
var variants = {
    normal: {
        scale: 1,
    },
    hovered: {
        scale: 1.05,
    },
    selected: {
        scale: 1.02,
    },
    tap: {
        scale: 0.98,
    },
};
/**
 * Top-level primitive to compose leaf nodes renderers.
 * This container provides the state via data-* attributes
 */
exports.ElementNodeContainer = (0, react_1.forwardRef)(function (_a, ref) {
    var _b;
    var _c = _a.nodeProps, _d = _c.selected, selected = _d === void 0 ? false : _d, _e = _c.selectable, selectable = _e === void 0 ? false : _e, _f = _c.data, _g = _f.hovered, isHovered = _g === void 0 ? false : _g, _h = _f.dimmed, isDimmed = _h === void 0 ? false : _h, data = __rest(_f, ["hovered", "dimmed"]), className = _a.className, style = _a.style, children = _a.children, rest = __rest(_a, ["nodeProps", "className", "style", "children"]);
    var variant;
    switch (true) {
        case isHovered:
            variant = 'hovered';
            break;
        case selected:
            variant = 'selected';
            break;
        default:
            variant = 'normal';
    }
    var _j = (0, types_1.ensureSizes)((_b = data.style) !== null && _b !== void 0 ? _b : {}), size = _j.size, padding = _j.padding, textSize = _j.textSize;
    return (<m.div ref={ref} className={(0, css_1.cx)((0, recipes_1.elementNode)(), 'group', className)} variants={variants} initial={false} {...selectable && {
        animate: variant,
        whileTap: 'tap',
    }} data-likec4-hovered={isHovered} data-likec4-color={data.color} data-likec4-shape={data.shape} data-likec4-shape-size={size} data-likec4-spacing={padding} data-likec4-text-size={textSize} {...(isDimmed !== false && {
        'data-likec4-dimmed': isDimmed,
    })} style={style} tabIndex={-1} {...rest}>
      {children}
    </m.div>);
});
exports.ElementNodeContainer.displayName = 'ElementNodeContainer';
