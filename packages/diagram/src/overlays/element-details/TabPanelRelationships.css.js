"use strict";
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.edgeNum = exports.panelScope = exports.xyflow = exports.relationshipStat = exports.fqn = void 0;
var css_1 = require("@likec4/styles/css");
exports.fqn = (0, css_1.css)({
    display: 'inline-block',
    fontSize: 'sm',
    fontWeight: 'medium',
    whiteSpace: 'nowrap',
    padding: '[3px 6px]',
    borderRadius: 'xs',
    background: "var(--likec4-palette-fill)/75",
    lineHeight: 1.2,
    color: 'var(--likec4-palette-hiContrast)',
});
exports.relationshipStat = (0, css_1.css)((_a = {
        _light: {
            background: 'mantine.colors.gray[1]',
            '&[data-missing': {},
        }
    },
    _a["&[data-missing]"] = {
        color: 'mantine.colors.orange[4]',
        background: "mantine.colors.orange[8]/15",
        borderColor: "mantine.colors.orange[5]/20",
        _light: {
            color: 'mantine.colors.orange[8]',
        },
    },
    _a));
exports.xyflow = (0, css_1.css)({
    flex: '1 1 100%',
    position: 'relative',
    width: '100%',
    height: '100%',
    background: 'body',
    border: 'default',
    borderRadius: 'sm',
    _light: {
        borderColor: 'mantine.colors.gray[3]',
        background: 'mantine.colors.gray[1]',
    },
});
exports.panelScope = (0, css_1.css)({
    _before: {
        content: '"scope:"',
        position: 'absolute',
        top: '0',
        left: '2',
        fontSize: 'xxs',
        fontWeight: 'medium',
        lineHeight: '1',
        color: 'text.dimmed',
        opacity: 0.85,
        transform: 'translateY(-100%) translateY(-2px)',
    },
    _light: {
        '& .mantine-SegmentedControl-root': {
            background: 'mantine.colors.gray[3]',
        },
    },
});
exports.edgeNum = (0, css_1.css)((_b = {
        display: 'inline-block',
        fontSize: 'xl',
        fontWeight: 'bold',
        padding: '[1px 5px]',
        minWidth: '24px',
        textAlign: 'center',
        borderRadius: 'sm',
        background: 'mantine.colors.dark[7]',
        color: 'default.color'
    },
    _b["&[data-zero]"] = {
        color: 'text.dimmed',
    },
    _b["&[data-missing]"] = {
        color: 'mantine.colors.orange[4]',
        background: "mantine.colors.orange[8]/20",
    },
    _b));
