"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompoundDetailsButton = CompoundDetailsButton;
var css_1 = require("@likec4/styles/css");
var recipes_1 = require("@likec4/styles/recipes");
var core_1 = require("@mantine/core");
var hooks_1 = require("@mantine/hooks");
var icons_react_1 = require("@tabler/icons-react");
var m = require("motion/react-m");
var xyflow_1 = require("../../utils/xyflow");
var actionbtns_css_1 = require("./actionbtns.css");
var variants = {
    normal: {
        scale: 1,
        // opacity: 0.6,
    },
    hovered: {
        scale: 1.2,
        // opacity: 1,
    },
    whileHover: {
        scale: 1.4,
    },
    whileTap: {
        scale: 1,
    },
};
function CompoundDetailsButton(_a) {
    var _b = _a.data.hovered, isHovered = _b === void 0 ? false : _b, icon = _a.icon, onClick = _a.onClick;
    // Debounce first "isHovered"
    var debounced = (0, hooks_1.useDebouncedValue)(isHovered, isHovered ? 130 : 0);
    var isHoverDebounced = debounced[0] && isHovered;
    var variant = isHoverDebounced ? 'hovered' : 'normal';
    return (<m.div initial={false} variants={variants} animate={variant} whileHover="whileHover" whileTap="whileTap" className="likec4-compound-details details-button" tabIndex={-1}>
      <core_1.ActionIcon className={(0, css_1.cx)('nodrag nopan', (0, actionbtns_css_1.compoundActionBtn)({
            delay: isHovered && !isHoverDebounced,
        }), (0, recipes_1.actionBtn)({ variant: 'transparent' }))} tabIndex={-1} onClick={onClick} onDoubleClick={xyflow_1.stopPropagation}>
        {icon !== null && icon !== void 0 ? icon : <icons_react_1.IconId stroke={1.8} style={{ width: '75%' }}/>}
      </core_1.ActionIcon>
    </m.div>);
}
