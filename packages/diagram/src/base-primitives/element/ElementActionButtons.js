"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElementActionButtons = ElementActionButtons;
var css_1 = require("@likec4/styles/css");
var recipes_1 = require("@likec4/styles/recipes");
var core_1 = require("@mantine/core");
var hooks_1 = require("@mantine/hooks");
var icons_react_1 = require("@tabler/icons-react");
var m = require("motion/react-m");
var xyflow_1 = require("../../utils/xyflow");
var variants = {
    normal: {
        originY: 0,
        opacity: 0.75,
        scale: 0.8,
        y: 0,
    },
    selected: {
        originY: 0,
        opacity: 1,
        scale: 0.9,
        y: 7,
    },
    hovered: {
        originY: 0,
        opacity: 1,
        scale: 1.12,
        y: 7,
    },
};
/**
 * Center-Bottom bar with action buttons. Intended to be used inside "leaf" nodes.
 *
 * @param selected - Whether the node is selected
 * @param data - Node data
 * @param buttons - Action buttons
 *
 * @example
 * ```tsx
 * <ElementActionButtons
 *   {...nodeProps}
 *   Buttons={[
 *     {
 *       key: 'action1',
 *       icon: <IconZoomScan />,
 *       onClick: (e) => {
 *         e.stopPropagation()
 *         console.log('action1 clicked')
 *       },
 *     },
 *     //...
 *   ]}
 * />
 * ```
 */
function ElementActionButtons(_a) {
    var _b = _a.selected, selected = _b === void 0 ? false : _b, _c = _a.data.hovered, isHovered = _c === void 0 ? false : _c, buttons = _a.buttons;
    var id = (0, hooks_1.useId)();
    if (!buttons.length) {
        return null;
    }
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
    return (<div className={(0, recipes_1.actionButtons)()}>
      <m.div layoutRoot initial={false} variants={variants} animate={variant} layoutDependency={"".concat(isHovered, "-").concat(selected)} data-likec4-hovered={isHovered} className={(0, css_1.cx)('nodrag nopan')} onClick={xyflow_1.stopPropagation}>
        {buttons.map(function (button, index) {
            var _a;
            return (<core_1.ActionIcon component={m.button} 
            // layout
            className={(0, recipes_1.actionBtn)({})} key={"".concat(id, "-").concat((_a = button.key) !== null && _a !== void 0 ? _a : index)} initial={false} whileTap={{ scale: 1 }} whileHover={{
                    scale: 1.3,
                }} tabIndex={-1} onClick={button.onClick} 
            // Otherwise node receives click event and is selected
            onDoubleClick={xyflow_1.stopPropagation}>
            {button.icon || <icons_react_1.IconBolt />}
          </core_1.ActionIcon>);
        })}
      </m.div>
    </div>);
}
