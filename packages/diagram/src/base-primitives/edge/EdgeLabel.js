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
exports.EdgeLabel = void 0;
var core_1 = require("@likec4/core");
var css_1 = require("@likec4/styles/css");
var jsx_1 = require("@likec4/styles/jsx");
var recipes_1 = require("@likec4/styles/recipes");
var m = require("motion/react-m");
var react_1 = require("react");
var remeda_1 = require("remeda");
exports.EdgeLabel = (0, react_1.forwardRef)(function (_a, ref) {
    var _b = _a.edgeProps, id = _b.id, _c = _b.data, label = _c.label, technology = _c.technology, _d = _c.hovered, isHovered = _d === void 0 ? false : _d, _e = _b.selected, selected = _e === void 0 ? false : _e, _f = _b.selectable, selectable = _f === void 0 ? false : _f, _g = _a.pointerEvents, pointerEvents = _g === void 0 ? 'all' : _g, className = _a.className, children = _a.children, rest = __rest(_a, ["edgeProps", "pointerEvents", "className", "children"]);
    var stepNum = (0, core_1.isStepEdgeId)(id) ? (0, core_1.extractStep)(id) : null;
    var isStepEdge = stepNum !== null;
    var hasLabel = (0, remeda_1.isTruthy)(label) || (0, remeda_1.isTruthy)(technology);
    return (<m.div ref={ref} className={(0, css_1.cx)(
        // This class is queried by RelationshipPopover to position near the edge label
        'likec4-edge-label', (0, recipes_1.edgeLabel)({
            pointerEvents: pointerEvents,
            isStepEdge: isStepEdge,
            cursor: selectable || isStepEdge ? 'pointer' : 'default',
        }), className)} data-edge-id={id} animate={{
            scale: isHovered && !selected ? 1.06 : 1,
        }} {...rest}>
      {stepNum !== null && (<jsx_1.Box className={'likec4-edge-label__step-number'}>
          {stepNum}
        </jsx_1.Box>)}
      {hasLabel && (<jsx_1.Box className={'likec4-edge-label__contents'}>
          {(0, remeda_1.isTruthy)(label) && (<jsx_1.Box lineClamp={5} className={'likec4-edge-label__text'}>
              {label}
            </jsx_1.Box>)}
          {(0, remeda_1.isTruthy)(technology) && (<jsx_1.Box className={'likec4-edge-label__technology'}>
              {'[ ' + technology + ' ]'}
            </jsx_1.Box>)}
          {children}
        </jsx_1.Box>)}
    </m.div>);
});
exports.EdgeLabel.displayName = 'EdgeLabel';
