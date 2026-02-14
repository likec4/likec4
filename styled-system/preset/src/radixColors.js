"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.radixColorsPreset = void 0;
var pandacss_preset_radix_colors_1 = require("pandacss-preset-radix-colors");
var types_ts_1 = require("./defaults/types.ts");
exports.radixColorsPreset = (0, pandacss_preset_radix_colors_1.default)({
    autoP3: false,
    darkMode: {
        condition: '[data-mantine-color-scheme="dark"] &',
    },
    colorScales: __spreadArray([], types_ts_1.DefaultTagColors, true),
});
