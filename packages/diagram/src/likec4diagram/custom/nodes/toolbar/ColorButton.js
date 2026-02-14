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
exports.ColorButton = ColorButton;
exports.ColorSwatches = ColorSwatches;
exports.OpacityOption = OpacityOption;
var jsx_1 = require("@likec4/styles/jsx");
var core_1 = require("@mantine/core");
var web_1 = require("@react-hookz/web");
var react_1 = require("react");
var remeda_1 = require("remeda");
var useLikeC4Styles_1 = require("../../../../hooks/useLikeC4Styles");
var types_1 = require("./types");
function ColorButton(_a) {
    var elementColor = _a.elementColor, elementOpacity = _a.elementOpacity, onColorPreview = _a.onColorPreview, _b = _a.isOpacityEditable, isOpacityEditable = _b === void 0 ? false : _b, onChange = _a.onChange, props = __rest(_a, ["elementColor", "elementOpacity", "onColorPreview", "isOpacityEditable", "onChange"]);
    var theme = (0, useLikeC4Styles_1.useLikeC4Styles)().theme;
    return (<core_1.Popover clickOutsideEvents={['pointerdown', 'mousedown', 'click']} position="top-start" offset={2} withinPortal={false} {...props}>
      <core_1.PopoverTarget>
        <core_1.Button variant="subtle" color="gray" size="xs" px={6}>
          <core_1.ColorSwatch color={theme.colors[elementColor].elements.fill} size={16} withShadow style={{ color: '#fff', cursor: 'pointer' }}/>
        </core_1.Button>
      </core_1.PopoverTarget>
      <core_1.PopoverDropdown p={'xs'}>
        <ColorSwatches theme={theme} elementColor={elementColor} onColorPreview={onColorPreview} onChange={function (color) { return onChange({ color: color }); }}/>
        {isOpacityEditable && (<>
            <core_1.Space h={'xs'}/>
            <core_1.Divider label="opacity" labelPosition="left"/>
            <core_1.Space h={'xs'}/>
            <OpacityOption elementOpacity={elementOpacity} onOpacityChange={function (opacity) {
                onChange({ opacity: opacity });
            }}/>
          </>)}
      </core_1.PopoverDropdown>
    </core_1.Popover>);
}
function ColorSwatches(_a) {
    var theme = _a.theme, elementColor = _a.elementColor, onColorPreview = _a.onColorPreview, onChange = _a.onChange;
    var changeColor = function (color) { return function (e) {
        e.stopPropagation();
        onColorPreview(null);
        if (elementColor === color) {
            return;
        }
        onChange(color);
    }; };
    var otherColors = (0, remeda_1.keys)(theme.colors).filter(function (color) { return !types_1.SemanticColors.includes(color); });
    return (<core_1.Stack gap={2} onMouseLeave={function () { return onColorPreview(null); }}>
      <core_1.TooltipGroup openDelay={1000} closeDelay={300}>
        <jsx_1.Flex maxW={'120px'} gap="1.5" justify="flex-start" align="flex-start" direction="row" wrap="wrap">
          {types_1.SemanticColors.map(function (color) { return (<core_1.Tooltip key={color} label={color} fz={'xs'} color="dark" offset={2} withinPortal={false} transitionProps={{ duration: 140, transition: 'slide-up' }}>
              <core_1.ColorSwatch color={theme.colors[color].elements.fill} size={18} withShadow onMouseEnter={function () { return onColorPreview(color); }} onClick={changeColor(color)} style={{ color: '#fff', cursor: 'pointer' }}>
                {elementColor === color && <core_1.CheckIcon style={{ width: (0, core_1.rem)(10), height: (0, core_1.rem)(10) }}/>}
              </core_1.ColorSwatch>
            </core_1.Tooltip>); })}
        </jsx_1.Flex>

        <jsx_1.Flex mt="sm" maxW={'110px'} gap="1.5" justify="flex-start" align="flex-start" direction="row" wrap="wrap">
          {otherColors.map(function (key) { return (<core_1.Tooltip key={key} label={key} fz={'xs'} color="dark" offset={2} transitionProps={{ duration: 140, transition: 'slide-up' }}>
              <core_1.ColorSwatch color={theme.colors[key].elements.fill} size={18} onMouseEnter={function () { return onColorPreview(key); }} onClick={changeColor(key)} style={{ color: '#fff', cursor: 'pointer' }}>
                {elementColor === key && <core_1.CheckIcon style={{ width: (0, core_1.rem)(10), height: (0, core_1.rem)(10) }}/>}
              </core_1.ColorSwatch>
            </core_1.Tooltip>); })}
        </jsx_1.Flex>
      </core_1.TooltipGroup>
    </core_1.Stack>);
}
function OpacityOption(_a) {
    var _b = _a.elementOpacity, elementOpacity = _b === void 0 ? 100 : _b, onOpacityChange = _a.onOpacityChange;
    var _c = (0, react_1.useState)(elementOpacity), value = _c[0], setValue = _c[1];
    (0, web_1.useUpdateEffect)(function () {
        setValue(elementOpacity);
    }, [elementOpacity]);
    return (<core_1.Slider size={'sm'} color={'dark'} value={value} onChange={setValue} onChangeEnd={onOpacityChange}/>);
}
