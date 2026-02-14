"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.controlPoint = exports.controlPointsContainer = void 0;
var css_1 = require("@likec4/styles/css");
exports.controlPointsContainer = (0, css_1.css)({
    overflow: 'visible',
    position: 'absolute',
    pointerEvents: 'none',
    top: '0',
    left: '0',
    mixBlendMode: {
        _dark: 'screen',
        _light: 'multiply',
    },
    zIndex: '[100]',
});
exports.controlPoint = (0, css_1.css)((_a = {
        fill: "[var(--xy-edge-stroke)]",
        stroke: "transparent",
        fillOpacity: 0.5,
        strokeWidth: 10,
        r: 4,
        cursor: 'grab',
        pointerEvents: 'all',
        visibility: 'hidden',
        transitionDuration: '120ms',
        transitionProperty: 'visibility, fill, fill-opacity, r',
        transitionTimingFunction: 'inOut',
        transitionDelay: '20ms'
    },
    _a[":where([data-likec4-selected='true'], [data-likec4-hovered='true']) &"] = {
        visibility: 'visible',
        fillOpacity: 1,
        transitionTimingFunction: 'out',
        transitionDelay: '0ms',
    },
    _a[":where([data-likec4-selected='true']) &"] = {
        r: 6,
    },
    _a[":is([data-likec4-hovered='true']) &"] = {
        r: 8,
    },
    _a._hover = {
        fill: 'mantine.colors.primary.filledHover',
        r: 10,
        transitionDuration: '100ms',
    },
    _a._groupActive = {
        cursor: 'grabbing',
    },
    _a));
