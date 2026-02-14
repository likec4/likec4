"use strict";
var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", { value: true });
exports.resizeHandle = exports.propertyLabel = exports.propertiesGrid = exports.tabsPanel = exports.tabsTab = exports.tabsList = exports.tabsRoot = exports.viewButtonTitle = exports.viewButton = exports.elementIcon = exports.title = exports.cardHeader = exports.card = exports.dialog = exports.backdropOpacity = exports.backdropBlur = void 0;
var css_1 = require("@likec4/styles/css");
exports.backdropBlur = '--_blur';
exports.backdropOpacity = '--_opacity';
exports.dialog = (0, css_1.css)({
    boxSizing: 'border-box',
    margin: '0',
    padding: '0',
    position: 'fixed',
    inset: '0',
    width: '100vw',
    height: '100vh',
    maxWidth: '100vw',
    maxHeight: '100vh',
    background: 'transparent',
    border: 'transparent',
    _backdrop: {
        // WebkitBackdropFilter: `blur(${backdropBlur})`,
        backdropFilter: 'auto',
        backdropBlur: "var(".concat(exports.backdropBlur, ")"),
        backgroundColor: "[rgb(36 36 36 / var(".concat(exports.backdropOpacity, ", 5%))]"),
    },
});
exports.card = (0, css_1.css)({
    position: 'absolute',
    pointerEvents: 'all',
    display: 'flex',
    flexDirection: 'column',
    padding: '4',
    gap: 'lg',
    justifyContent: 'stretch',
    color: 'text',
    boxShadow: 'md',
    overflow: 'hidden',
    border: 'none',
    background: "[\n    linear-gradient(180deg,\n    color-mix(in oklab, var(--likec4-palette-fill) 60%, transparent),\n    color-mix(in oklab, var(--likec4-palette-fill) 20%, transparent) 8px,\n    color-mix(in oklab, var(--likec4-palette-fill) 14%, transparent) 20px,\n    transparent 80px\n    ),\n    linear-gradient(180deg, var(--likec4-palette-fill), var(--likec4-palette-fill) 4px, transparent 4px),\n    {colors.likec4.overlay.body}\n  ]",
    '& .react-flow__attribution': {
        display: 'none',
    },
});
exports.cardHeader = (0, css_1.css)({
    flex: 0,
    cursor: 'move',
});
exports.title = (0, css_1.css)({
    display: 'block',
    fontFamily: 'likec4.element',
    fontOpticalSizing: 'auto',
    fontStyle: 'normal',
    fontWeight: 'bold',
    fontSize: '24px',
    // lineHeight: 1.15,
    lineHeight: 'xs',
    // color: vars.element.hiContrast
});
var iconSize = '40px';
exports.elementIcon = (0, css_1.css)({
    flex: "0 0 ".concat(iconSize),
    height: iconSize,
    width: iconSize,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    cursor: 'move',
    _dark: {
        mixBlendMode: 'hard-light',
    },
    '& :where(svg, img)': {
        width: '100%',
        height: 'auto',
        maxHeight: '100%',
        pointerEvents: 'none',
        filter: "\n    drop-shadow(0 0 3px rgb(0 0 0 / 10%))\n    drop-shadow(0 1px 8px rgb(0 0 0 / 5%))\n    drop-shadow(1px 1px 16px rgb(0 0 0 / 2%))\n  ",
    },
    '& img': {
        objectFit: 'contain',
    },
});
var viewTitleColor = '--view-title-color';
var iconColor = '--icon-color';
exports.viewButton = (0, css_1.css)((_a = {
        // display: 'flex',
        width: '100%',
        background: 'body',
        borderRadius: 'sm',
        padding: "[10px 8px]",
        // gap: 6,
        // alignItems: 'flex-start',
        transition: 'fast',
        border: "1px dashed",
        borderColor: 'default.border'
    },
    _a[viewTitleColor] = '{colors.mantine.colors.dark[1]}',
    _a._hover = (_b = {
            background: 'default.hover'
        },
        _b[iconColor] = '{colors.mantine.colors.dark[1]}',
        _b[viewTitleColor] = '{colors.default.color}',
        _b),
    _a._dark = {
        background: 'mantine.colors.dark[6]',
    },
    _a._light = (_c = {},
        _c[iconColor] = '{colors.mantine.colors.gray[6]}',
        _c[viewTitleColor] = '{colors.mantine.colors.gray[7]}',
        _c._hover = (_d = {},
            _d[iconColor] = '{colors.mantine.colors.gray[7]}',
            _d),
        _c),
    _a['& .mantine-ThemeIcon-root'] = {
        transition: 'fast',
        // color: fallbackVar(iconColor, 'mantine.colors.dark[2])',
        color: "[var(".concat(iconColor, ", {colors.mantine.colors.dark[2]})]"),
        '--ti-size': '22px',
        _hover: {
            color: 'default.color',
        },
    },
    _a['& > *'] = {
        transition: "all 130ms {easings.inOut}",
    },
    _a['&:hover > *'] = {
        transitionTimingFunction: 'out',
        transform: 'translateX(1.6px)',
    },
    _a));
exports.viewButtonTitle = (0, css_1.css)({
    transition: 'fast',
    color: "[var(".concat(viewTitleColor, ", {colors.mantine.colors.gray[7]})]"),
    fontSize: '15px',
    fontWeight: 'medium',
    lineHeight: '1.4',
});
exports.tabsRoot = (0, css_1.css)({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'stretch',
    overflow: 'hidden',
    gap: 'sm',
});
exports.tabsList = (0, css_1.css)({
    // flex: '0',
    background: 'mantine.colors.gray[1]',
    borderRadius: 'sm',
    flexWrap: 'nowrap',
    gap: '1.5', // 6px
    padding: '1',
    _dark: {
        background: 'mantine.colors.dark[7]',
    },
});
exports.tabsTab = (0, css_1.css)((_e = {
        fontSize: 'xs',
        fontWeight: 'medium',
        flexGrow: 1,
        padding: '[6px 8px]',
        transition: 'fast',
        borderRadius: 'sm',
        color: 'mantine.colors.gray[7]',
        _hover: {
            transitionTimingFunction: 'out',
            color: 'default.color',
            background: 'mantine.colors.gray[3]',
        }
    },
    _e['&[data-active]'] = {
        transition: 'none',
        background: 'white',
        shadow: 'xs',
        color: 'default.color',
    },
    _e._dark = (_f = {
            color: 'mantine.colors.dark[1]',
            _hover: {
                color: 'white',
                background: 'mantine.colors.dark[6]',
            }
        },
        _f["&:is([data-active])"] = {
            color: 'white',
            background: 'mantine.colors.dark[5]',
        },
        _f),
    _e));
exports.tabsPanel = (0, css_1.css)({
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
    '&:not(:has(.mantine-ScrollArea-root))': {
        paddingLeft: '1',
        paddingRight: '1',
    },
    '& .mantine-ScrollArea-root': {
        width: '100%',
        height: '100%',
        '& > div': {
            paddingLeft: '1',
            paddingRight: '1',
        },
    },
});
exports.propertiesGrid = (0, css_1.css)({
    flex: 1,
    display: 'grid',
    gridTemplateColumns: 'min-content 1fr',
    gridAutoRows: 'min-content max-content',
    gap: "[24px 20px]",
    alignItems: 'baseline',
    justifyItems: 'stretch',
});
exports.propertyLabel = (0, css_1.css)({
    justifySelf: 'end',
    textAlign: 'right',
    userSelect: 'none',
});
exports.resizeHandle = (0, css_1.css)({
    position: 'absolute',
    width: '14px',
    height: '14px',
    border: "3.5px solid",
    borderColor: 'mantine.colors.dark[3]',
    borderTop: 'none',
    borderLeft: 'none',
    borderRadius: 'xs',
    bottom: '0.5',
    right: '0.5',
    transition: 'fast',
    cursor: 'se-resize',
    _hover: {
        borderWidth: '4px',
        borderColor: 'mantine.colors.dark[1]',
    },
});
