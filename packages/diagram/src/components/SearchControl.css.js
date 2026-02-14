"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shortcut = exports.placeholder = exports.root = void 0;
var css_1 = require("@likec4/styles/css");
exports.root = (0, css_1.css)({
    height: '30px',
    paddingLeft: 'sm',
    paddingRight: '1',
    borderRadius: 'sm',
    // TODO
    // color: fallbackVar('var(--search-color)', 'mantine.colors.placeholder)',
    border: '1px solid',
    borderColor: {
        base: 'default.border',
        _light: 'mantine.colors.gray[4]',
        _dark: 'mantine.colors.dark[4]',
        _hover: 'default.border',
    },
    cursor: 'pointer',
    background: {
        base: 'default',
        _light: 'white',
        _dark: 'mantine.colors.dark[6]',
        _hover: 'default.hover',
    },
    width: '100%',
    '& .tabler-icon': {
        color: 'text',
    },
    transition: {
        base: 'fast',
        _whenPanning: 'none !important',
    },
    boxShadow: {
        base: 'xs',
        _hover: 'sm',
        _whenPanning: 'none !important',
    },
});
exports.placeholder = (0, css_1.css)({
    fontSize: 'sm', // mantine.fontSizes.sm,
    fontWeight: 'medium',
    paddingRight: '2.5', // 10px
    color: 'text.placeholder',
    flex: '1',
    sm: {
        paddingRight: '[30px]',
    },
    md: {
        paddingRight: '[50px]',
    },
});
exports.shortcut = (0, css_1.css)({
    fontSize: '11px',
    fontWeight: 'bold',
    lineHeight: 1,
    padding: '[4px 7px]',
    borderRadius: 'sm',
    border: '1px solid',
    transition: 'fast',
    _light: {
        color: 'mantine.colors.gray[7]',
        borderColor: 'mantine.colors.gray[2]',
    },
    _dark: {
        color: 'mantine.colors.dark[0]',
        borderColor: 'mantine.colors.dark[7]',
    },
    backgroundColor: {
        _light: 'mantine.colors.gray[2]/70',
        _dark: 'mantine.colors.dark[8]/70',
        _groupHover: {
            _light: 'mantine.colors.gray[2]',
            _dark: 'mantine.colors.dark[8]',
        },
    },
});
