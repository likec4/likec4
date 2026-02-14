"use strict";
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.spacingSliderThumb = exports.spacingSliderBody = exports.autolayoutIndicator = exports.autolayoutButton = exports.autolayoutIcon = exports.actionIconGroup = exports.panel = exports.navigationButtons = void 0;
var css_1 = require("@likec4/styles/css");
exports.navigationButtons = (0, css_1.css)({
    gap: 'xxs',
    _empty: {
        display: 'none',
    },
});
exports.panel = (0, css_1.css)((_a = {
        top: 'md',
        left: 'md',
        margin: '0',
        pointerEvents: 'none',
        '& :where(button, .action-icon, [role=\'dialog\'])': {
            pointerEvents: 'all',
        }
    },
    _a['& .action-icon'] = (_b = {},
        _b['--ai-size'] = '2rem',
        _b),
    _a['& .tabler-icon'] = {
        width: '65%',
        height: '65%',
    },
    _a._reduceGraphics = {
        '& .action-icon': {
            '--ai-radius': '0px',
        },
    },
    _a));
exports.actionIconGroup = (0, css_1.css)({
    shadow: {
        base: 'md',
        _whenPanning: 'none',
    },
});
exports.autolayoutIcon = (0, css_1.css)((_c = {},
    _c['& .tabler-icon'] = {
        width: '65%',
        height: '65%',
    },
    _c));
exports.autolayoutButton = (0, css_1.css)({
    flex: '1 1 40%',
    textAlign: 'center',
    fontWeight: 'medium',
    padding: '[4px 6px]',
    fontSize: '11px',
    zIndex: 1,
});
exports.autolayoutIndicator = (0, css_1.css)({
    background: 'mantine.colors.gray[2]',
    borderRadius: 'sm',
    border: "1px solid",
    borderColor: 'mantine.colors.gray[4]',
    _dark: {
        background: 'mantine.colors.dark[5]',
        borderColor: 'mantine.colors.dark[4]',
    },
});
exports.spacingSliderBody = (0, css_1.css)({
    position: 'relative',
    borderRadius: 'sm',
    background: 'mantine.colors.gray[3]',
    boxShadow: 'inset 1px 1px 3px 0px #00000024',
    _dark: {
        background: 'mantine.colors.dark[7]',
    },
});
exports.spacingSliderThumb = (0, css_1.css)({
    position: 'absolute',
    width: '8px',
    height: '8px',
    border: "2px solid",
    borderColor: 'mantine.colors.gray[5]',
    borderRadius: 'sm',
    transform: 'translate(-50%, -50%)',
});
