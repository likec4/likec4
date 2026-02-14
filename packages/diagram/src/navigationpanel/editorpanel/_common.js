"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tooltip = void 0;
var core_1 = require("@mantine/core");
exports.Tooltip = core_1.Tooltip.withProps({
    color: 'dark',
    fz: 'xs',
    openDelay: 600,
    closeDelay: 120,
    label: '',
    children: null,
    offset: 8,
    position: 'right',
});
