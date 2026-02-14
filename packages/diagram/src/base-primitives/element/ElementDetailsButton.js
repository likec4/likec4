"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElementDetailsButton = ElementDetailsButton;
var css_1 = require("@likec4/styles/css");
var jsx_1 = require("@likec4/styles/jsx");
var recipes_1 = require("@likec4/styles/recipes");
var core_1 = require("@mantine/core");
var icons_react_1 = require("@tabler/icons-react");
var m = require("motion/react-m");
var xyflow_1 = require("../../utils/xyflow");
var variants = {
    normal: {
        originX: 0.4,
        originY: 0.6,
        scale: 1,
        opacity: 0.5,
    },
    hovered: {
        originX: 0.4,
        originY: 0.6,
        scale: 1.25,
        opacity: 0.9,
    },
    selected: {
        originX: 0.4,
        originY: 0.6,
        scale: 1.25,
        opacity: 0.9,
    },
    whileHover: {
        scale: 1.4,
        opacity: 1,
    },
    whileTap: {
        scale: 1.15,
    },
};
var container = (0, css_1.css)({
    position: 'absolute',
    top: '0.5',
    right: '0.5',
    _shapeBrowser: {
        right: '[5px]',
    },
    _shapeCylinder: {
        top: '[14px]',
    },
    _shapeStorage: {
        top: '[14px]',
    },
    _shapeQueue: {
        top: '[1px]',
        right: '3', // 12px
    },
    _smallZoom: {
        display: 'none',
    },
    _print: {
        display: 'none',
    },
});
function ElementDetailsButton(_a) {
    var _b = _a.selected, selected = _b === void 0 ? false : _b, _c = _a.data.hovered, isHovered = _c === void 0 ? false : _c, icon = _a.icon, onClick = _a.onClick;
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
    return (<jsx_1.Box className={(0, css_1.cx)(container, 'details-button')}>
      <core_1.ActionIcon className={(0, css_1.cx)('nodrag nopan', (0, recipes_1.actionBtn)({ variant: 'transparent' }))} component={m.button} initial={false} variants={variants} animate={variant} whileHover="whileHover" whileTap="whileTap" onClick={onClick} onDoubleClick={xyflow_1.stopPropagation} tabIndex={-1}>
        {icon !== null && icon !== void 0 ? icon : <icons_react_1.IconId stroke={1.8} style={{ width: '75%' }}/>}
      </core_1.ActionIcon>
    </jsx_1.Box>);
}
