"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.utilities = void 0;
var dev_1 = require("@pandacss/dev");
var durationValues = [
    'fastest',
    'faster',
    'fast',
    'normal',
    'slow',
    'slower',
    'slowest',
    'none',
];
exports.utilities = {
    extend: {
        transition: (0, dev_1.defineUtility)({
            values: durationValues,
            className: 'transition',
            transform: function (value, _a) {
                var token = _a.token;
                if (value === 'none') {
                    return {
                        transition: 'none',
                    };
                }
                if (!durationValues.includes(value)) {
                    return {
                        transition: value,
                    };
                }
                return {
                    transitionDuration: token("durations.".concat(value)),
                    transitionTimingFunction: token('easings.inOut'),
                };
            },
        }),
    },
};
