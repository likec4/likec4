"use strict";
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
Object.defineProperty(exports, "__esModule", { value: true });
exports.elementNodeData = void 0;
var dev_1 = require("@pandacss/dev");
var const_ts_1 = require("../const.ts");
var sizes_ts_1 = require("../defaults/sizes.ts");
var parts = (0, dev_1.defineParts)({
    root: { selector: '&' },
    icon: { selector: '& [data-likec4-icon]' },
    content: { selector: '& .likec4-element-node-content' },
    title: { selector: '& [data-likec4-node-title]' },
    description: { selector: '& [data-likec4-node-description]' },
    technology: { selector: '& [data-likec4-node-technology]' },
});
var hasIcon = '&:has([data-likec4-icon])';
var textAlign = '--__text-align';
var varTextAlign = "var(".concat(textAlign, ")");
exports.elementNodeData = (0, dev_1.defineRecipe)({
    className: 'likec4-element-node-data',
    jsx: ['ElementNodeData', 'ElementNodeData.Root', 'ElementTitle', 'Root'],
    base: parts({
        root: (_a = {
                position: 'relative',
                flex: '1',
                height: 'fit-content',
                width: 'fit-content',
                maxHeight: '100%',
                maxWidth: '100%',
                margin: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                paddingTop: (0, const_ts_1.__v)('spacing'),
                paddingBottom: (0, const_ts_1.__v)('spacing'),
                paddingLeft: "calc(".concat((0, const_ts_1.__v)('spacing'), " + 8px)"),
                paddingRight: "calc(".concat((0, const_ts_1.__v)('spacing'), " + 8px)"),
                overflow: 'hidden',
                pointerEvents: 'none',
                gap: '3'
            },
            _a[textAlign] = 'center',
            _a._shapeQueue = {
                paddingLeft: '46px',
                paddingRight: '16px',
            },
            _a._shapeMobile = {
                paddingLeft: '46px',
                paddingRight: '16px',
            },
            _a._shapeCylinder = {
                paddingTop: '30px',
            },
            _a._shapeStorage = {
                paddingTop: '30px',
            },
            _a._shapeBrowser = {
                paddingTop: '32px',
                paddingBottom: '28px',
            },
            _a._shapeBucket = {
                paddingLeft: "calc(".concat((0, const_ts_1.__v)('spacing'), " + 20px)"),
                paddingRight: "calc(".concat((0, const_ts_1.__v)('spacing'), " + 20px)"),
            },
            _a._shapeComponent = {
                paddingLeft: "calc(".concat((0, const_ts_1.__v)('spacing'), " + 30px)"),
            },
            _a._shapeSizeXs = (_b = {},
                _b[const_ts_1.vars.icon.size] = "".concat(sizes_ts_1.defaultSizes.iconSizes.xs, "px"),
                _b),
            _a._shapeSizeSm = (_c = {},
                _c[const_ts_1.vars.icon.size] = "".concat(sizes_ts_1.defaultSizes.iconSizes.sm, "px"),
                _c),
            _a._shapeSizeMd = (_d = {},
                _d[const_ts_1.vars.icon.size] = "".concat(sizes_ts_1.defaultSizes.iconSizes.md, "px"),
                _d),
            _a._shapeSizeLg = (_e = {},
                _e[const_ts_1.vars.icon.size] = "".concat(sizes_ts_1.defaultSizes.iconSizes.lg, "px"),
                _e.gap = '4',
                _e),
            _a._shapeSizeXl = (_f = {},
                _f[const_ts_1.vars.icon.size] = "".concat(sizes_ts_1.defaultSizes.iconSizes.xl, "px"),
                _f.gap = '4',
                _f),
            _a[hasIcon] = {
                gap: '4',
            },
            _a),
        icon: {
            flex: "0 0 ".concat((0, const_ts_1.__v)('icon.size', '48px')),
            height: (0, const_ts_1.__v)('icon.size', '48px'),
            width: (0, const_ts_1.__v)('icon.size', '48px'),
            display: 'flex',
            alignSelf: 'flex-start',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            color: (0, const_ts_1.__v)('icon.color', 'palette.hiContrast'),
            '& svg, & img': {
                width: '100%',
                height: 'auto',
                maxHeight: '100%',
                transition: 'fast',
                filter: {
                    base: [
                        'drop-shadow(0 1px 3px rgb(0 0 0 / 20%))',
                        // 'drop-shadow(0 0 3px rgb(0 0 0 / 12%))',
                        // 'drop-shadow(1px 1px 16px rgb(0 0 0 / 3%))',
                    ].join('\n'),
                    _whenHovered: [
                        'drop-shadow(0 2px 4px rgb(0 0 0 / 30%))',
                        // `drop-shadow(1px 2px 3px var(--likec4-palette-stroke))`,
                        // 'drop-shadow(0 0 3px rgb(0 0 0 / 12%))',
                        // 'drop-shadow(1px 1px 16px rgb(0 0 0 / 3%))',
                    ].join('\n'),
                    _reduceGraphicsOnPan: 'none!',
                },
            },
            '& img': {
                objectFit: 'contain',
            },
        },
        content: {
            height: 'fit-content',
            width: 'fit-content',
            maxHeight: '100%',
            maxWidth: '100%',
            flex: '0 1 auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            justifyContent: 'center',
            flexWrap: 'nowrap',
            overflow: 'hidden',
            gap: '2',
            '&:has([data-likec4-node-description]):has([data-likec4-node-technology])': {
                gap: '1.5',
            },
        },
        title: {
            flex: '0 0 auto',
            fontFamily: 'likec4.element',
            fontWeight: 'medium',
            fontSize: (0, const_ts_1.__v)('textsize'),
            lineHeight: 'sm',
            textWrapStyle: 'balance',
            whiteSpace: 'preserve-breaks',
            textAlign: varTextAlign,
            color: (0, const_ts_1.__v)('palette.hiContrast'),
            lineClamp: {
                base: 3,
                _shapeSizeXs: 2,
                _shapeSizeSm: 2,
            },
        },
        description: {
            flexGrow: '0',
            flexShrink: '1',
            fontFamily: 'likec4.element',
            fontWeight: '420',
            fontSize: "calc(".concat((0, const_ts_1.__v)('textsize'), " * 0.74)"),
            lineHeight: 'xs',
            textWrapStyle: 'pretty',
            '--text-fz': "calc(".concat((0, const_ts_1.__v)('textsize'), " * 0.74)"),
            color: (0, const_ts_1.__v)('palette.loContrast'),
            textAlign: varTextAlign,
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            lineClamp: {
                base: '5',
                _shapeSizeSm: '3',
            },
            display: {
                _shapeSizeXs: 'none!',
                _smallZoom: 'none!',
            },
            '& a': {
                pointerEvents: 'all',
            },
            '& .markdown-alert': {
                mixBlendMode: 'screen',
            },
        },
        technology: {
            flex: '0 0 auto',
            fontFamily: 'likec4.element',
            fontWeight: 'normal',
            fontSize: "calc(".concat((0, const_ts_1.__v)('textsize'), " * 0.635)"),
            lineHeight: 'xs',
            '--text-fz': "calc(".concat((0, const_ts_1.__v)('textsize'), " * 0.635)"),
            color: (0, const_ts_1.__v)('palette.loContrast'),
            textAlign: varTextAlign,
            textWrap: 'balance',
            opacity: {
                base: 0.92,
                _whenHovered: 1,
            },
            display: {
                _shapeSizeXs: 'none!',
                _shapeSizeSm: 'none!',
                _smallZoom: 'none!',
            },
        },
    }),
    variants: {
        iconPosition: {
            left: parts({
                root: (_g = {},
                    _g[hasIcon] = (_h = {},
                        _h[textAlign] = 'left',
                        _h['& .likec4-element-node-content'] = {
                            minWidth: "calc(50% + calc(".concat((0, const_ts_1.__v)('icon.size'), " / 2))"),
                            alignItems: 'flex-start',
                        },
                        _h),
                    _g),
            }),
            right: parts({
                root: (_j = {},
                    _j[hasIcon] = (_k = {
                            flexDirection: 'row-reverse'
                        },
                        _k[textAlign] = 'right',
                        _k.gap = '4',
                        _k['& .likec4-element-node-content'] = {
                            minWidth: "calc(50% - calc(".concat((0, const_ts_1.__v)('icon.size'), " / 2))"),
                            alignItems: 'flex-end',
                        },
                        _k),
                    _j),
            }),
            top: parts({
                root: (_l = {},
                    _l[hasIcon] = {
                        flexDirection: 'column',
                        gap: '2',
                        height: '100%',
                        '& .likec4-element-node-content': {
                            minHeight: "calc(50% - ".concat((0, const_ts_1.__v)('icon.size'), ")"),
                            justifyContent: 'flex-start',
                        },
                    },
                    _l),
                icon: {
                    alignSelf: 'center',
                },
            }),
            bottom: parts({
                root: (_m = {},
                    _m[hasIcon] = {
                        flexDirection: 'column-reverse',
                        gap: '2',
                        height: '100%',
                        '& .likec4-element-node-content': {
                            justifyContent: 'flex-end',
                            minHeight: "calc(50% - ".concat((0, const_ts_1.__v)('icon.size'), ")"),
                        },
                    },
                    _m),
                icon: {
                    alignSelf: 'center',
                },
            }),
        },
        withIconColor: {
            true: parts({
                icon: {
                    '& svg': {
                        color: (0, const_ts_1.__v)('icon.color', 'palette.stroke'),
                    },
                },
            }),
            false: parts({
                icon: {
                    mixBlendMode: {
                        base: 'hard-light',
                        _reduceGraphicsOnPan: 'normal',
                    },
                },
            }),
        },
    },
    defaultVariants: {
        iconPosition: 'left',
        withIconColor: false,
    },
    staticCss: [{
            withIconColor: ['*'],
            iconPosition: ['*'],
            conditions: ['*'],
        }],
});
