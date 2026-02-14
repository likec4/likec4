"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.breadcrumbTitle = void 0;
var css_1 = require("@likec4/styles/css");
exports.breadcrumbTitle = (0, css_1.cva)({
    base: {
        fontSize: 'sm',
        fontWeight: 'medium',
        transition: 'fast',
        color: {
            base: 'likec4.panel.action',
            _hover: 'likec4.panel.action.hover',
        },
    },
    variants: {
        truncate: {
            'true': {
                truncate: true,
            },
        },
        dimmed: {
            'true': {
                color: {
                    base: 'likec4.panel.text.dimmed',
                    _hover: 'likec4.panel.action',
                },
            },
        },
    },
});
