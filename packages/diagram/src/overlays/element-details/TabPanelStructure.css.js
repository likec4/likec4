"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.elementLabel = exports.treeNodeLabel = void 0;
var css_1 = require("@likec4/styles/css");
exports.treeNodeLabel = (0, css_1.css)({
    marginTop: 'sm',
    marginBottom: 'sm',
});
exports.elementLabel = (0, css_1.css)({
    display: 'inline-flex',
    transition: 'fast',
    border: "1px dashed",
    borderColor: 'default.border',
    borderRadius: 'sm',
    px: 'md',
    py: 'xs',
    alignItems: 'center',
    cursor: 'pointer',
    color: 'mantine.colors.gray[7]',
    _dark: {
        color: 'mantine.colors.dark[1]',
    },
    '& > *': {
        transition: 'fast',
    },
    _hover: {
        transitionTimingFunction: 'out',
        borderStyle: 'solid',
        color: 'default.color',
        background: 'default.hover',
        '& > *': {
            transitionTimingFunction: 'out',
            transform: 'translateX(1px)',
        },
    },
});
