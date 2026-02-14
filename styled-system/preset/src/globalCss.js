"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalCss = void 0;
var remeda_1 = require("remeda");
var const_ts_1 = require("./const.ts");
var index_ts_1 = require("./defaults/index.ts");
var helpers_ts_1 = require("./helpers.ts");
var sizeConditions = __assign(__assign({}, (0, remeda_1.mapToObj)((0, remeda_1.keys)(index_ts_1.defaultTheme.textSizes), function (size) {
    var _a;
    return [
        ":where([data-likec4-text-size='".concat(size, "'])"),
        (_a = {},
            _a[const_ts_1.vars.textsize] = "{fontSizes.likec4.".concat(size, "}"),
            _a),
    ];
})), (0, remeda_1.mapToObj)((0, remeda_1.keys)(index_ts_1.defaultTheme.spacing), function (size) {
    var _a;
    return [
        ":where([data-likec4-spacing='".concat(size, "'])"),
        (_a = {},
            _a[const_ts_1.vars.spacing] = "{spacing.likec4.".concat(size, "}"),
            _a),
    ];
}));
exports.globalCss = {
    extend: __assign(__assign({ 
        // '@supports ((hanging-punctuation: first) and (font: -apple-system-body) and (-webkit-appearance: none))': {
        //   // TODO: this workaround disables animations in Safari (to improve performance)
        //   ['--likec4-safari-animation-hook']: '/*-*/ /*-*/',
        // },
        ':where(:root,:host)': (_a = {},
            _a['--likec4-app-font-default'] = "'IBM Plex Sans Variable',ui-sans-serif,system-ui,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\",\"Segoe UI Symbol\",\"Noto Color Emoji\"",
            _a) }, sizeConditions), { '.likec4-shadow-root': {
            display: 'contents',
            color: 'var(--colors-text)',
            '--mantine-font-family': 'var(--likec4-app-font, var(--likec4-app-font-default))',
            '--mantine-font-family-headings': 'var(--likec4-app-font, var(--likec4-app-font-default))',
            '& dialog': {
                '--mantine-font-family': 'var(--likec4-app-font, var(--likec4-app-font-default))',
                color: 'var(--colors-text)',
            },
        }, '.likec4-edge-label-container': {
            top: 0,
            left: 0,
            position: 'absolute',
            width: 'auto',
            height: 'auto',
            display: {
                _reduceGraphicsOnPan: 'none',
                _smallZoom: 'none',
            },
            willChange: 'transform',
            zIndex: 'likec4.diagram.edge.label',
        }, '.likec4-root': {
            overflow: 'hidden',
            position: 'relative',
            padding: 0,
            margin: 0,
            width: '100%',
            height: '100%',
            border: '0px solid transparent',
            background: 'transparent',
            containerName: 'likec4-root',
            containerType: 'size',
            _print: {
                '& .react-flow__background': {
                    display: 'none',
                },
                '& .react-flow': {
                    background: 'transparent !important',
                    '--xy-background-color': 'transparent !important',
                },
                '& *': {
                    colorAdjust: 'exact!',
                    printColorAdjust: 'exact!',
                },
            },
            '& .mantine-ActionIcon-icon .tabler-icon': {
                width: '75%',
                height: '75%',
            },
            '& .react-flow': {
                '--xy-background-color': 'var(--colors-likec4-background)',
                '--xy-background-pattern-color': 'var(--colors-likec4-background-pattern, var(--colors-likec4-background))',
                '&:is(.not-initialized)': {
                    opacity: 0,
                },
                '&:is(.bg-transparent)': {
                    background: 'transparent !important',
                    '--xy-background-color': 'transparent !important',
                },
                '& .react-flow__pane': {
                    userSelect: 'none',
                },
                '& :is(.react-flow__nodes, .react-flow__edges, .react-flow__edgelabel-renderer, .react-flow__viewport-portal)': {
                    display: 'contents',
                },
                '& .react-flow__node.draggable:has(.likec4-compound-node)': {
                    cursor: 'default',
                },
                '& .likec4-node-handle-center': {
                    top: '50%!',
                    left: '50%!',
                    right: 'unset!',
                    bottom: 'unset!',
                    visibility: 'hidden!',
                    width: '5px!',
                    height: '5px!',
                    transform: 'translate(-50%, -50%)!',
                },
            },
            '& :where(.react-flow__node, .react-flow__edge):has([data-likec4-dimmed])': {
                opacity: 0.25,
            },
            '& .likec4-edge-label-container:is([data-likec4-dimmed])': {
                opacity: 0.25,
            },
            '& :where(.react-flow__edge, .likec4-edge-container, .likec4-edge-label-container)': {
                '--xy-edge-stroke-width': 3,
                '--xy-edge-stroke': (0, const_ts_1.__v)('palette.relationStroke'),
                '--xy-edge-stroke-selected': (0, const_ts_1.__v)('palette.relationStrokeSelected'),
                '--xy-edge-label-color': {
                    base: (0, const_ts_1.__v)('palette.relationLabel'),
                    _light: "oklch(from ".concat((0, const_ts_1.__v)('palette.relationLabel'), " calc(l + 0.05) c h)"),
                },
                '--xy-edge-label-background-color': {
                    _dark: (0, helpers_ts_1.alpha)((0, const_ts_1.__v)('palette.relationLabelBg'), 45),
                    _light: (0, helpers_ts_1.alpha)((0, const_ts_1.__v)('palette.relationLabelBg'), 60),
                },
                '&:is([data-likec4-hovered="true"], [data-edge-active="true"])': {
                    '--xy-edge-stroke-width': 4,
                    '--xy-edge-stroke': (0, const_ts_1.__v)('palette.relationStrokeSelected'),
                },
            },
            '&:is([data-likec4-reduced-graphics="true"]) .hide-on-reduced-graphics': {
                display: 'none!',
            },
            '&:not([data-likec4-reduced-graphics="true"])': {
                '& :where(.react-flow__node, .react-flow__edge):has([data-likec4-dimmed])': {
                    filter: 'grayscale(85%)',
                },
                '& :where(.react-flow__node, .react-flow__edge):has([data-likec4-dimmed="true"])': {
                    transitionProperty: 'opacity, filter',
                    transitionTimingFunction: 'cubic-bezier(0.50, 0, 0.2, 1)',
                    transitionDuration: '400ms',
                },
                '& .likec4-edge-label-container:is([data-likec4-dimmed])': {
                    filter: 'grayscale(85%)',
                },
                '& .likec4-edge-label-container:is([data-likec4-dimmed="true"])': {
                    transitionProperty: 'opacity, filter',
                    transitionTimingFunction: 'cubic-bezier(0.50, 0, 0.2, 1)',
                    transitionDuration: '400ms',
                },
                '& :where(.react-flow__edgelabel-renderer) > *': {
                    mixBlendMode: {
                        base: 'hard-light',
                        _dark: 'screen',
                        _print: 'normal!',
                    },
                },
                '& :where(.react-flow__edges) > svg': {
                    mixBlendMode: {
                        base: 'multiply',
                        _dark: 'plus-lighter',
                        _print: 'normal!',
                    },
                },
                '&:has(.react-flow__node-seq-parallel) :where(.react-flow__edges > svg)': {
                    mixBlendMode: {
                        // _dark: 'plus-lighter',
                        _light: 'color-burn',
                    },
                },
                '& .react-flow__node-seq-parallel': {
                    mixBlendMode: {
                        _dark: 'luminosity',
                        _light: 'color-burn',
                        _print: 'normal!',
                    },
                },
            },
        }, ':where(.likec4-static-view, .relationships-browser, .likec4-relationship-details) .react-flow .react-flow__attribution': {
            display: 'none',
        } }),
};
