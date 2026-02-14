"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.instanceLabel = exports.nodeLabel = exports.treeNodeLabel = exports.treeNode = void 0;
var css_1 = require("@likec4/styles/css");
exports.treeNode = (0, css_1.css)((_a = {},
    _a["&[data-level='1']"] = {
        marginBottom: 'sm',
    },
    _a));
exports.treeNodeLabel = (0, css_1.css)({
    cursor: 'default',
    marginTop: '0',
    marginBottom: '0',
});
var label = (0, css_1.css)({
    transition: 'fast',
    color: 'mantine.colors.gray[7]',
    _dark: {
        color: 'mantine.colors.dark[1]',
    },
    '& > *': {
        transition: 'fast',
    },
    _hover: {
        transitionTimingFunction: 'out',
        '& > :not([data-no-transform])': {
            transitionTimingFunction: 'out',
            transform: 'translateX(1px)',
        },
    },
    //   '.mantine-Button-root:hover & > :not([data-no-transform])': {
    // transitionTimingFunction: 'out',
    //   transform: 'translateX(1px)',
    //   },
});
exports.nodeLabel = (0, css_1.cx)(label);
exports.instanceLabel = (0, css_1.cx)(label, (0, css_1.css)({
    cursor: 'pointer',
    width: '100%',
    justifyContent: 'stretch',
    flexWrap: 'nowrap',
    height: '36px',
    paddingInlineStart: '[16px]',
    paddingInlineEnd: '2.5', // 10px
    borderRadius: 'sm',
    alignItems: 'center',
    color: 'mantine.colors.gray[7]',
    _dark: {
        color: 'mantine.colors.gray.lightColor',
    },
    _hover: {
        background: 'mantine.colors.gray.lightHover',
    },
    '& .tabler-icon': {
        transition: 'fast',
        width: '90%',
        opacity: 0.65,
    },
}));
