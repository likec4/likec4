"use strict";
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.shapeBadge = exports.shapeSvg = exports.elementNotation = exports.tabPanel = exports.card = exports.icon = exports.container = void 0;
var css_1 = require("@likec4/styles/css");
exports.container = (0, css_1.css)({
    position: 'absolute',
    bottom: '0',
    right: '0',
    padding: '2',
    margin: '0',
    width: 'min-content',
    height: 'min-content',
    _print: {
        display: 'none',
    },
});
exports.icon = (0, css_1.css)((_a = {},
    _a['--ai-radius'] = '0px',
    _a._noReduceGraphics = (_b = {},
        _b['--ai-radius'] = '{radii.md}',
        _b),
    _a));
exports.card = (0, css_1.css)({
    cursor: 'default',
    userSelect: 'none',
    minWidth: 200,
    maxWidth: 'calc(100vw - 20px)',
    backgroundColor: "body/80",
    // WebkitBackdropFilter: fallbackVar(vars.safariAnimationHook, 'blur(8px)'),
    // backdropFilter: fallbackVar(vars.safariAnimationHook, 'blur(8px)'),
    sm: {
        minWidth: 300,
        maxWidth: "65vw",
    },
    md: {
        maxWidth: "40vw",
    },
    _dark: {
        backgroundColor: "mantine.colors.dark[6]/80",
    },
});
exports.tabPanel = (0, css_1.css)({
    padding: 'xxs',
});
// export const description = css({
//   whiteSpaceCollapse: 'preserve-breaks',
//   color: mantine.colors.gray[7],
//   selectors: {
//     [`${whereDark} &`]: {
//       color: mantine.colors.gray[5]
//     }
//   }
// })
exports.elementNotation = (0, css_1.css)({
    backgroundColor: 'transparent',
    transition: 'all 100ms ease-in',
    // WebkitBackdropFilter: fallbackVar(vars.safariAnimationHook, 'blur(8px)'),
    // backdropFilter: fallbackVar(vars.safariAnimationHook, 'blur(8px)'),
    // vars: {
    //   // [stokeFillMix]: `color-mix(in oklab, ${vars.element.stroke} 90%, ${vars.element.fill})`
    // },
    _hover: {
        transition: 'all 120ms ease-out',
        // backgroundColor:
        backgroundColor: "mantine.colors.primary[2]/50",
    },
    _dark: {
        _hover: {
            backgroundColor: "mantine.colors.dark[3]/40",
        },
    },
});
exports.shapeSvg = (0, css_1.css)({
    fill: 'var(--likec4-palette-fill)',
    stroke: 'var(--likec4-palette-stroke)',
    strokeWidth: 1,
    overflow: 'visible',
    width: '100%',
    height: 'auto',
    filter: "\n    drop-shadow(0 2px 3px rgb(0 0 0 / 22%))\n    drop-shadow(0 1px 8px rgb(0 0 0 / 10%))\n  ",
});
exports.shapeBadge = (0, css_1.css)((_c = {
        fontWeight: 'medium',
        letterSpacing: '0.2px',
        paddingTop: '0',
        paddingBottom: '0',
        textTransform: 'lowercase',
        transition: 'all 150ms ease-in-out',
        cursor: 'pointer'
    },
    _c['--badge-radius'] = '2px',
    _c['--badge-fz'] = '9.5px',
    _c['--badge-padding-x'] = '3px',
    _c['--badge-height'] = '13.5px',
    _c['--badge-lh'] = '1',
    _c['--badge-bg'] = 'var(--likec4-palette-fill)',
    _c['--badge-color'] = 'var(--likec4-palette-hiContrast)',
    _c));
