"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrollArea = exports.label = exports.node = void 0;
var css_1 = require("@likec4/styles/css");
exports.node = (0, css_1.css)({
    margin: '0',
});
exports.label = (0, css_1.css)({
    _hover: {
        backgroundColor: 'mantine.colors.gray[0]',
        _dark: {
            backgroundColor: 'default.hover',
            color: 'white',
        },
    },
});
exports.scrollArea = (0, css_1.css)({
    maxHeight: [
        '70vh',
        'calc(100cqh - 70px)',
    ],
});
