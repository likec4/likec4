"use strict";
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", { value: true });
exports.overlay = void 0;
var dev_1 = require("@pandacss/dev");
var backdropBlur = '--_blur';
var backdropOpacity = '--_opacity';
var level = '--_level';
var offset = '--_offset';
var inset = '--_inset';
var borderRadius = '--_border-radius';
var parts = (0, dev_1.defineParts)({
    dialog: { selector: '&' },
    body: { selector: '& .likec4-overlay-body' },
});
exports.overlay = (0, dev_1.defineRecipe)({
    description: 'Recipe for Overlay Dialog',
    className: 'likec4-overlay',
    base: parts({
        dialog: (_a = {
                boxSizing: 'border-box',
                margin: '0',
                position: 'fixed',
                width: '100vw',
                height: '100vh',
                maxWidth: '100vw',
                maxHeight: '100vh',
                background: "likec4.overlay.border",
                shadow: 'xl',
                border: 'transparent',
                outline: 'none',
                borderRadius: "var(".concat(borderRadius, ")")
            },
            _a[backdropBlur] = '0px',
            _a[level] = '0',
            _a[offset] = '0px',
            _a[inset] = 'calc((1 + var(--_level) * 0.75) * var(--_offset))',
            _a[backdropOpacity] = '0%',
            _a[borderRadius] = '0px',
            _a._backdrop = {
                cursor: 'zoom-out',
            },
            _a.inset = '0',
            _a.padding = '0',
            _a),
        body: {
            position: 'relative',
            containerName: 'likec4-dialog',
            containerType: 'size',
            border: "transparent",
            overflow: 'hidden',
            width: '100%',
            height: '100%',
            background: 'likec4.overlay.body',
        },
    }),
    variants: {
        fullscreen: {
            false: {
                dialog: {
                    sm: (_b = {
                            inset: '[var(--_inset) var(--_inset) var(--_offset) var(--_inset)]',
                            width: 'calc(100vw - 2 * var(--_inset))',
                            height: 'calc(100vh - var(--_offset) - var(--_inset))'
                        },
                        _b[borderRadius] = '6px',
                        _b.padding = '1.5',
                        _b[offset] = '{spacing.4}',
                        _b),
                    md: (_c = {},
                        _c[offset] = '{spacing.4}',
                        _c),
                    lg: (_d = {},
                        _d[offset] = '{spacing.8}',
                        _d),
                    xl: (_e = {},
                        _e[offset] = '{spacing.16}',
                        _e),
                },
                body: {
                    sm: {
                        borderRadius: "calc(var(".concat(borderRadius, ") - 2px)"),
                    },
                },
            },
            true: {
                dialog: {
                    inset: '0',
                    padding: '0',
                },
            },
        },
        withBackdrop: {
            false: {
                dialog: {
                    _backdrop: {
                        display: 'none',
                    },
                },
            },
            true: {
                dialog: {
                    _backdrop: {
                        backdropFilter: "blur(var(".concat(backdropBlur, "))"),
                        background: "color-mix(in oklab, {colors.likec4.overlay.backdrop} var(".concat(backdropOpacity, "), transparent)"),
                    },
                },
            },
        },
    },
    defaultVariants: {
        fullscreen: false,
        withBackdrop: true,
    },
    staticCss: [{
            fullscreen: ['*'],
            withBackdrop: ['*'],
        }],
});
