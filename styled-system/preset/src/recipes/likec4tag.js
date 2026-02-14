"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.likec4tag = void 0;
var dev_1 = require("@pandacss/dev");
exports.likec4tag = (0, dev_1.defineRecipe)({
    className: 'likec4-tag',
    base: {
        pointerEvents: 'all',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 40,
        width: 'min-content',
        transition: 'fast',
        fontSize: 'xs',
        gap: '[1px]',
        cursor: 'default',
        fontFamily: 'likec4',
        fontWeight: 'bold',
        layerStyle: 'likec4.tag',
        whiteSpace: 'nowrap',
        px: '1',
        py: '0',
    },
    variants: {
        autoTextColor: {
            false: {
                '& > span': {
                    color: 'likec4.tag.text',
                    _first: {
                        opacity: 0.65,
                    },
                },
            },
            true: {
                '& > span': {
                    color: 'transparent',
                    filter: 'invert(1) grayscale(1) brightness(1.3) contrast(1000)',
                    background: 'inherit',
                    backgroundClip: 'text',
                    mixBlendMode: {
                        base: 'plus-lighter',
                        _print: 'normal!',
                    },
                },
            },
        },
    },
    defaultVariants: {
        autoTextColor: false,
    },
    staticCss: [{
            autoTextColor: ['true', 'false'],
            conditions: ['hover'],
        }],
});
