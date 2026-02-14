"use strict";
var _a, _b, _c, _d, _e, _f, _g;
Object.defineProperty(exports, "__esModule", { value: true });
exports.compoundNode = void 0;
var dev_1 = require("@pandacss/dev");
var const_ts_1 = require("../const.ts");
var helpers_ts_1 = require("../helpers.ts");
var borderWidth = {
    var: '--_border-width',
    ref: 'var(--_border-width)',
};
var borderRadius = {
    var: '--_border-radius',
    ref: 'var(--_border-radius)',
};
var compoundTransparency = {
    var: '--_compound-transparency',
    ref: 'var(--_compound-transparency)',
};
var borderTransparency = {
    var: '--_border-transparency',
    ref: 'var(--_border-transparency)',
};
var indicatorSpacing = {
    var: '--_indicator-spacing',
    ref: 'var(--_indicator-spacing)',
};
var compoundColor = {
    var: '--_compound-color',
    ref: 'var(--_compound-color)',
};
var parts = (0, dev_1.defineParts)({
    root: { selector: '&' },
    titleContainer: { selector: '& .likec4-compound-title-container' },
    title: { selector: '& .likec4-compound-title' },
    icon: { selector: '& .likec4-compound-icon' },
    navigationBtn: { selector: '& .likec4-compound-navigation' },
    detailsBtn: { selector: '& .likec4-compound-details' },
    actionBtn: { selector: '& .action-btn' },
});
var iconSize = '20px';
exports.compoundNode = (0, dev_1.defineRecipe)({
    className: 'likec4-compound-node',
    base: parts({
        root: (_a = {
                position: 'relative',
                width: '100%',
                height: '100%',
                padding: '0',
                margin: '0',
                pointerEvents: 'none',
                backgroundClip: 'padding-box',
                borderStyle: 'solid',
                borderWidth: borderWidth.ref,
                borderRadius: borderRadius.ref,
                boxSizing: 'border-box'
            },
            _a[const_ts_1.vars.palette.outline] = {
                base: "oklch(from ".concat((0, const_ts_1.__v)('palette.stroke'), " calc(l - 0.15) c h)"),
                _dark: "oklch(from ".concat((0, const_ts_1.__v)('palette.stroke'), " calc(l + 0.2) c h)"),
            },
            _a[borderWidth.var] = '3px',
            _a[borderRadius.var] = '6px',
            _a[compoundTransparency.var] = '100%',
            _a[borderTransparency.var] = '100%',
            _a[indicatorSpacing.var] = "calc(".concat(borderWidth.ref, " + 1px)"),
            _a[const_ts_1.vars.icon.color] = compoundColor.ref,
            _a.color = compoundColor.ref,
            _a._before = {
                position: 'absolute',
                content: '" "',
                top: "calc(1px - ".concat(indicatorSpacing.ref, " - ").concat(borderWidth.ref, ")"),
                left: "calc(1px - ".concat(indicatorSpacing.ref, " - ").concat(borderWidth.ref, ")"),
                width: "calc(100% + 2 * (".concat(indicatorSpacing.ref, " + ").concat(borderWidth.ref, " - 1px))"),
                height: "calc(100% + 2 * (".concat(indicatorSpacing.ref, " + ").concat(borderWidth.ref, " - 1px))"),
                borderStyle: 'solid',
                borderWidth: "calc(".concat(borderWidth.ref, " + 1px)"),
                borderRadius: "calc(".concat(borderRadius.ref, " + 4px)"),
                borderColor: (0, const_ts_1.__v)('palette.outline'),
                pointerEvents: 'none',
                display: {
                    base: 'none',
                    _whenFocused: 'block',
                    _whenSelected: 'block',
                },
                animationStyle: 'indicator',
                animationPlayState: {
                    base: 'paused',
                    _whenFocused: 'running',
                    _whenSelected: 'running',
                    _whenPanning: 'paused',
                },
            },
            _a["&:has(.likec4-compound-navigation) .likec4-compound-title-container"] = {
                paddingLeft: '[24px]',
            },
            _a),
        titleContainer: (_b = {
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                gap: '1.5', // 6px
                left: '2.5',
                top: '0.5',
                right: '30px',
                width: 'auto',
                minHeight: '28px',
                color: compoundColor.ref
            },
            _b[":where(.react-flow__node.draggable) &"] = {
                pointerEvents: 'all',
                cursor: 'grab',
            },
            _b),
        title: {
            flex: '1',
            fontFamily: 'likec4.compound',
            fontWeight: 600,
            fontSize: '15px',
            textTransform: 'uppercase',
            letterSpacing: '0.25px',
            lineHeight: '1',
        },
        icon: (_c = {
                flex: "0 0 ".concat(iconSize),
                height: "".concat(iconSize),
                width: "".concat(iconSize),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mixBlendMode: {
                    base: 'hard-light',
                    _reduceGraphicsOnPan: 'normal',
                    _print: 'normal!',
                }
            },
            _c["& svg, & img"] = {
                width: '100%',
                height: 'auto',
                maxHeight: '100%',
                pointerEvents: 'none',
                filter: {
                    base: [
                        'drop-shadow(0 0 3px rgb(0 0 0 / 12%))',
                        'drop-shadow(0 1px 8px rgb(0 0 0 / 8%))',
                        'drop-shadow(1px 1px 16px rgb(0 0 0 / 3%))',
                    ].join('\n'),
                    _reduceGraphicsOnPan: 'none',
                },
            },
            _c["& img"] = {
                objectFit: 'contain',
            },
            _c),
        actionBtn: {
            '--actionbtn-color': "oklch(from ".concat(compoundColor.ref, " calc(l - 0.1) c h)"),
            '--actionbtn-color-hovered': compoundColor.ref,
            '--actionbtn-color-hovered-btn': "oklch(from ".concat(compoundColor.ref, " calc(l + 0.2) c h)"),
            opacity: {
                base: 0.6,
                _whenHovered: 0.75,
                _whenSelected: 0.75,
                _hover: 1,
            },
            _noReduceGraphics: {
                transition: 'fast',
            },
            _print: {
                display: 'none',
            },
        },
        navigationBtn: {
            position: 'absolute',
            top: '0.5',
            left: '0.5',
            _smallZoom: {
                display: 'none',
            },
            _print: {
                display: 'none',
            },
        },
        detailsBtn: {
            position: 'absolute',
            top: '0.5',
            right: '0.5',
            _smallZoom: {
                display: 'none',
            },
            _print: {
                display: 'none',
            },
        },
    }),
    variants: {
        isTransparent: {
            false: parts({
                root: (_d = {
                        boxShadow: {
                            _noReduceGraphics: '0 4px 10px 0.5px rgb(0 0 0/10%) , 0 2px 2px -1px rgb(0 0 0/40%)',
                            _whenSelected: 'none',
                            _whenPanning: 'none !important',
                        },
                        backgroundColor: (0, const_ts_1.__v)('palette.fill'),
                        borderColor: (0, const_ts_1.__v)('palette.stroke')
                    },
                    _d[compoundColor.var] = (0, helpers_ts_1.alpha)((0, const_ts_1.__v)('palette.hiContrast'), 90),
                    _d),
            }),
            true: parts({
                root: (_e = {
                        backgroundColor: (0, helpers_ts_1.alpha)((0, const_ts_1.__v)('palette.fill'), compoundTransparency.ref),
                        borderColor: (0, helpers_ts_1.alpha)((0, const_ts_1.__v)('palette.stroke'), borderTransparency.ref)
                    },
                    _e[compoundColor.var] = "color-mix(in oklch, ".concat((0, const_ts_1.__v)('palette.hiContrast'), ", ").concat((0, const_ts_1.__v)('palette.stroke'), " 10%)"),
                    _e),
            }),
        },
        // When the compound node is too transparent, the text color should be inverted
        inverseColor: {
            true: parts({
                root: (_f = {
                        '--_mix': "color-mix(in oklch, ".concat((0, const_ts_1.__v)('palette.hiContrast'), ", ").concat((0, const_ts_1.__v)('palette.stroke'), " 60%)")
                    },
                    _f[compoundColor.var] = {
                        base: 'oklch(from var(--_mix) calc(l - 0.2) c h)',
                        _dark: 'oklch(from var(--_mix) calc(l + 0.2) c h)',
                    },
                    _f),
                actionBtn: {
                    '--actionbtn-color': compoundColor.ref,
                    _light: {
                        '--actionbtn-color-hovered': (0, const_ts_1.__v)('palette.stroke'),
                        '--actionbtn-color-hovered-btn': (0, const_ts_1.__v)('palette.hiContrast'),
                        '--actionbtn-bg-hovered': (0, helpers_ts_1.alpha)((0, const_ts_1.__v)('palette.fill'), 30),
                        '--actionbtn-bg-hovered-btn': (0, const_ts_1.__v)('palette.fill'),
                    },
                },
            }),
            false: {},
        },
        borderStyle: {
            solid: parts({
                root: {
                    borderStyle: 'solid',
                },
            }),
            dashed: parts({
                root: {
                    borderStyle: 'dashed',
                },
            }),
            dotted: parts({
                root: {
                    borderStyle: 'dotted',
                },
            }),
            none: parts({
                root: (_g = {
                        // We still need to have a border for consistent internal coordinates
                        // So we use a transparent border and extend background
                        borderColor: 'transparent!',
                        backgroundClip: 'border-box!'
                    },
                    _g[indicatorSpacing.var] = "calc(".concat(borderWidth.ref, " * 2)"),
                    _g),
            }),
        },
    },
    defaultVariants: {
        isTransparent: false,
        inverseColor: false,
        borderStyle: 'none',
    },
    staticCss: [{
            isTransparent: ['*'],
            inverseColor: ['*'],
            borderStyle: ['*'],
        }],
});
