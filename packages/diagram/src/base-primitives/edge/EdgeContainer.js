"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.EdgeContainer = EdgeContainer;
var core_1 = require("@likec4/core");
var css_1 = require("@likec4/styles/css");
// export
//
function EdgeContainer(_a) {
    var _b;
    var className = _a.className, _c = _a.component, component = _c === void 0 ? 'g' : _c, _d = _a.selectable, selectable = _d === void 0 ? false : _d, _e = _a.selected, selected = _e === void 0 ? false : _e, _f = _a.data, _g = _f.color, color = _g === void 0 ? 'gray' : _g, _h = _f.hovered, isHovered = _h === void 0 ? false : _h, _j = _f.active, isActive = _j === void 0 ? false : _j, _k = _f.dimmed, isDimmed = _k === void 0 ? false : _k, data = __rest(_f, ["color", "hovered", "active", "dimmed"]), _l = _a.animated, animated = _l === void 0 ? false : _l, children = _a.children, style = _a.style;
    animated = animated || isActive;
    var props = __assign(__assign(__assign({ className: (0, css_1.cx)(className, 'likec4-edge-container', selected && 'selected', selectable && 'selectable'), 'data-likec4-color': color, 'data-edge-dir': (_b = data.dir) !== null && _b !== void 0 ? _b : 'forward', 'data-edge-active': isActive, 'data-likec4-hovered': isHovered }, (animated && {
        'data-likec4-animated': animated,
    })), (selected && {
        'data-likec4-selected': selected,
    })), (isDimmed !== false && {
        'data-likec4-dimmed': isDimmed,
    }));
    if (component === 'svg') {
        return (<svg style={style} {...props}>
        {children}
      </svg>);
    }
    (0, core_1.invariant)(component === 'g', 'EdgeContainer: component must be "g" or "svg"');
    return (<g style={style} {...props}>
      {children}
    </g>);
}
