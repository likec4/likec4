"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compoundActionBtn = void 0;
var css_1 = require("@likec4/styles/css");
exports.compoundActionBtn = (0, css_1.cva)({
    base: {
        transitionDuration: 'normal',
    },
    variants: {
        delay: {
            true: {
                // Debounce CSS transition
                transitionDelay: {
                    base: '0.2s',
                    _hover: '0s',
                },
            },
        },
    },
});
