"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.edgePath = void 0;
var dev_1 = require("@pandacss/dev");
exports.edgePath = (0, dev_1.defineSlotRecipe)({
    description: 'Recipe for Edge Path',
    slots: ['path', 'pathBg', 'markersCtx', 'middlePoint'],
    className: 'likec4-edge',
    jsx: [],
    base: {
        path: (_a = {
                fill: 'none',
                strokeDashoffset: 0,
                _noReduceGraphics: {
                    animationStyle: 'xyedgeAnimated',
                    animationPlayState: 'paused',
                    transition: 'stroke 130ms ease-out,stroke-width 130ms ease-out',
                }
            },
            _a[":where([data-edge-dir='back']) &"] = {
                animationDirection: 'reverse',
            },
            _a._whenHovered = {
                _noReduceGraphics: {
                    animationPlayState: 'running',
                    animationDelay: '450ms',
                },
            },
            _a[":where(.selected, [data-edge-active='true'], [data-edge-animated='true']) &"] = {
                _noReduceGraphics: {
                    animationPlayState: 'running',
                    animationDelay: '0ms',
                },
            },
            _a._whenDimmed = {
                animationPlayState: 'paused',
            },
            _a._smallZoom = {
                animationName: 'none',
            },
            _a._whenPanning = {
                strokeDasharray: 'none !important',
                animationPlayState: 'paused',
            },
            _a),
        pathBg: {
            pointerEvents: 'none',
            fill: 'none',
            strokeWidth: 'calc(var(--xy-edge-stroke-width) + 2)',
            strokeOpacity: 0.08,
            _noReduceGraphics: {
                transitionProperty: 'stroke-width, stroke-opacity',
                transitionDuration: 'fast',
                transitionTimingFunction: 'inOut',
            },
            _whenHovered: {
                transitionTimingFunction: 'out',
                strokeWidth: 'calc(var(--xy-edge-stroke-width) + 4)',
                strokeOpacity: 0.2,
            },
            _whenSelected: {
                strokeWidth: 'calc(var(--xy-edge-stroke-width) + 6)',
                strokeOpacity: 0.25,
                _whenHovered: {
                    strokeOpacity: 0.4,
                },
            },
        },
        // To fix issue with marker not inheriting color from path - we need to create container
        markersCtx: {
            fill: '[var(--xy-edge-stroke)]',
            stroke: '[var(--xy-edge-stroke)]',
        },
        middlePoint: {
            visibility: 'hidden',
            offsetDistance: '50%',
            cx: 0,
            cy: 0,
            r: 4,
            pointerEvents: 'none',
        },
    },
    staticCss: [{
            conditions: ['*'],
        }],
});
