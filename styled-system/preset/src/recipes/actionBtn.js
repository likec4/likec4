"use strict";
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.actionBtn = exports.actionButtons = void 0;
var dev_1 = require("@pandacss/dev");
var parts = (0, dev_1.defineParts)({
    root: { selector: '&' },
    container: { selector: '& > div' },
});
exports.actionButtons = (0, dev_1.defineRecipe)({
    className: 'action-buttons',
    description: 'Action Buttons Container within Diagram Node (Bottom-Center)',
    base: parts({
        root: {
            display: 'flex',
            flexDirection: 'row',
            position: 'absolute',
            top: 'calc(100% - 30px)',
            transform: 'translateX(-50%)',
            left: "50%",
            width: 'auto',
            minHeight: 30,
            zIndex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            _smallZoom: {
                display: 'none',
            },
        },
        container: {
            display: 'flex',
            flexDirection: 'row',
            gap: '1.5',
            justifyContent: 'center',
            alignItems: 'center',
        },
    }),
    staticCss: [{
            conditions: ['*'],
        }],
});
exports.actionBtn = (0, dev_1.defineRecipe)({
    className: 'action-btn',
    description: 'Action Button within Diagram Node (Bottom-Center)',
    base: {
        color: 'var(--actionbtn-color)',
        opacity: 0.75,
        '--actionbtn-color': 'var(--likec4-palette-loContrast)',
        '--actionbtn-color-hovered': 'var(--likec4-palette-loContrast)',
        '--actionbtn-color-hovered-btn': 'var(--likec4-palette-hiContrast)',
        '--actionbtn-bg-idle': "color-mix(in oklab , var(--likec4-palette-fill),  transparent 99%)",
        '--actionbtn-bg-hovered': "color-mix(in oklab , var(--likec4-palette-fill) 65%, var(--likec4-palette-stroke))",
        '--actionbtn-bg-hovered-btn': "color-mix(in oklab , var(--likec4-palette-fill) 50%, var(--likec4-palette-stroke))",
        '--ai-bg': "var(--actionbtn-bg-idle)",
        background: "var(--ai-bg)",
        _whenSelectable: {
            pointerEvents: 'all',
            cursor: 'pointer',
        },
        _whenHovered: {
            opacity: 1,
            color: 'var(--actionbtn-color-hovered)',
            '--ai-bg': "var(--actionbtn-bg-hovered)",
        },
        _hover: {
            opacity: 1,
            color: 'var(--actionbtn-color-hovered-btn)',
            '--ai-bg': "var(--actionbtn-bg-hovered-btn)",
        },
        _reduceGraphicsOnPan: {
            display: 'none',
        },
        _smallZoom: {
            display: 'none',
        },
        '& *': {
            pointerEvents: 'none',
        },
        _print: {
            display: 'none',
        },
    },
    variants: {
        variant: {
            transparent: {
                '--actionbtn-bg-hovered': "var(--actionbtn-bg-idle)",
            },
            filled: {
                boxShadow: {
                    base: '1px 1px 3px 0px transparent',
                    _whenHovered: '1px 1px 3px 0px rgba(0, 0, 0, 0.2)',
                    _reduceGraphics: 'none',
                },
            },
        },
        size: {
            sm: (_a = {},
                _a['--ai-size'] = "22px",
                _a),
            md: (_b = {},
                _b['--ai-size'] = "28px",
                _b),
        },
        radius: {
            sm: { '--ai-radius': "{radii.sm}" },
            md: { '--ai-radius': "{radii.md}" },
        },
    },
    defaultVariants: {
        size: 'md',
        radius: 'md',
        variant: 'filled',
    },
    staticCss: [{
            size: ['*'],
            radius: ['*'],
            variant: ['*'],
            conditions: ['*'],
        }],
});
