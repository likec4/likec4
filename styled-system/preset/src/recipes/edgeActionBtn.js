"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.edgeActionBtn = void 0;
var dev_1 = require("@pandacss/dev");
exports.edgeActionBtn = (0, dev_1.defineRecipe)({
    className: 'likec4-edge-action-btn',
    description: 'Action Button within Diagram Edge Label',
    base: {
        // zIndex: 'calc(var(--layer-overlays, 1) + 1)',
        pointerEvents: 'all',
        color: "var(--xy-edge-label-color)",
        cursor: 'pointer',
        opacity: 0.75,
        transition: 'fast',
        translate: 'auto',
        // '--ai-bg': 'var(--xy-edge-label-background-color)',
        '--ai-bg': 'transparent',
        '--ai-hover': "color-mix(in oklab , var(--xy-edge-label-background-color), {colors.likec4.mixColor} 10%)",
        '--ai-size': "28px",
        '--ai-radius': "{radii.sm}",
        _hover: {
            translateY: '[2px]',
            scale: 1.15,
        },
        _active: {
            translateY: '[-1px]',
            scale: '0.9',
        },
        _whenHovered: {
            '--ai-bg': 'var(--xy-edge-label-background-color)',
            opacity: 1,
        },
        '& .tabler-icon': {
            width: '80%',
            height: '80%',
            strokeWidth: '2',
        },
        _print: {
            display: 'none',
        },
    },
    variants: {},
    defaultVariants: {},
    staticCss: [{
            conditions: ['*'],
        }],
});
