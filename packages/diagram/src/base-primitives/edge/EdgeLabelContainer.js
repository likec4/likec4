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
exports.EdgeLabelContainer = EdgeLabelContainer;
var css_1 = require("@likec4/styles/css");
var react_1 = require("@xyflow/react");
var remeda_1 = require("remeda");
var toCssVarValue = function (value) {
    if (value === undefined)
        return '';
    return (0, remeda_1.isNumber)(value) ? "".concat(Math.trunc(value), "px") : value;
};
function EdgeLabelContainer(_a) {
    var _b, _c, _d;
    var _e = _a.edgeProps, id = _e.id, _f = _e.selected, selected = _f === void 0 ? false : _f, _g = _e.data, _h = _g.hovered, isHovered = _h === void 0 ? false : _h, _j = _g.active, isActive = _j === void 0 ? false : _j, _k = _g.dimmed, isDimmed = _k === void 0 ? false : _k, labelBBox = _g.labelBBox, _l = _g.color, color = _l === void 0 ? 'gray' : _l, animated = _e.animated, labelXY = _a.labelPosition, className = _a.className, _ = _a.style, // omit styles for container
    children = _a.children, rest = __rest(_a, ["edgeProps", "labelPosition", "className", "style", "children"]);
    var labelX = (_b = labelXY === null || labelXY === void 0 ? void 0 : labelXY.x) !== null && _b !== void 0 ? _b : labelBBox === null || labelBBox === void 0 ? void 0 : labelBBox.x, labelY = (_c = labelXY === null || labelXY === void 0 ? void 0 : labelXY.y) !== null && _c !== void 0 ? _c : labelBBox === null || labelBBox === void 0 ? void 0 : labelBBox.y;
    if (labelX === undefined || labelY === undefined) {
        return null;
    }
    var translate = (_d = labelXY === null || labelXY === void 0 ? void 0 : labelXY.translate) !== null && _d !== void 0 ? _d : '';
    animated = animated || isActive;
    return (<react_1.EdgeLabelRenderer>
      <div key={id} {...rest} className={(0, css_1.cx)('nodrag nopan', 'likec4-edge-label-container', className)} data-likec4-hovered={isHovered} data-likec4-color={color} data-edge-active={isActive} data-edge-animated={animated || isActive} {...animated && {
        'data-likec4-animated': animated,
    }} {...selected !== false && {
        'data-likec4-selected': selected,
    }} {...isDimmed !== false && {
        'data-likec4-dimmed': isDimmed,
    }} style={{
            transform: "translate(".concat(toCssVarValue(labelX), ", ").concat(toCssVarValue(labelY), ") ").concat(translate),
        }}>
        <div style={labelBBox ?
            {
                maxWidth: labelBBox.width + 20,
            } :
            undefined}>
          {children}
        </div>
      </div>
    </react_1.EdgeLabelRenderer>);
}
