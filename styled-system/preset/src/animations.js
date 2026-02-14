"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.animationStyles = exports.keyframes = void 0;
var dev_1 = require("@pandacss/dev");
exports.keyframes = (0, dev_1.defineKeyframes)({
    'indicatorOpacity': {
        '0%': {
            opacity: 0.8,
        },
        '100%': {
            opacity: 0.3,
        },
    },
    'xyedgeAnimated': {
        '0%': {
            strokeDashoffset: 36, // dash array (10,8)*2
        },
        '100%': {
            strokeDashoffset: 0,
        },
    },
});
exports.animationStyles = (0, dev_1.defineAnimationStyles)({
    'indicator': {
        value: {
            animationDuration: '.8s',
            animationIterationCount: 'infinite',
            animationDirection: 'alternate',
            animationName: 'indicatorOpacity',
            animationTimingFunction: '{easings.in}',
        },
    },
    'xyedgeAnimated': {
        value: {
            animationDuration: '.8s',
            animationIterationCount: 'infinite',
            animationTimingFunction: 'linear',
            animationFillMode: 'both',
            animationName: 'xyedgeAnimated',
        },
    },
});
