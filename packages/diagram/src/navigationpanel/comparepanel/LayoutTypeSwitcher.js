"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LayoutTypeSwitcher = LayoutTypeSwitcher;
var core_1 = require("@likec4/core");
var css_1 = require("@likec4/styles/css");
var core_2 = require("@mantine/core");
var m = require("motion/react-m");
var data = [
    { value: 'manual', label: 'Saved manual' },
    { value: 'auto', label: 'Latest auto' },
];
function LayoutTypeSwitcher(_a) {
    var value = _a.value, onChange = _a.onChange;
    return (<m.div layout="position">
      <core_2.SegmentedControl size="xs" color={value === 'manual' ? 'orange' : 'green'} value={value} component={m.div} onChange={function (layout) {
            (0, core_1.invariant)(layout === 'manual' || layout === 'auto', 'Invalid layout type');
            onChange(layout);
        }} classNames={{
            label: (0, css_1.css)({
                fontSize: 'xxs',
                fontWeight: 'medium',
            }),
        }} data={data}/>
    </m.div>);
}
