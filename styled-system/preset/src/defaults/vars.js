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
exports.vars = void 0;
exports.__v = __v;
var remeda_1 = require("remeda");
exports.vars = {
    font: '--likec4-app-font',
    spacing: '--likec4-spacing',
    textsize: '--likec4-text-size',
    palette: {
        fill: '--likec4-palette-fill',
        stroke: '--likec4-palette-stroke',
        hiContrast: '--likec4-palette-hiContrast',
        loContrast: '--likec4-palette-loContrast',
        relationStroke: '--likec4-palette-relation-stroke',
        relationStrokeSelected: '--likec4-palette-relation-stroke-selected',
        relationLabel: '--likec4-palette-relation-label',
        relationLabelBg: '--likec4-palette-relation-label-bg',
        outline: '--likec4-palette-outline',
    },
    icon: {
        size: '--likec4-icon-size',
        color: '--likec4-icon-color',
    },
};
function readName(key) {
    var path = (key.includes('.'))
        ? key.split('.')
        : [key];
    if (!(0, remeda_1.hasAtLeast)(path, 1)) {
        return undefined;
    }
    var name = remeda_1.prop.apply(void 0, __spreadArray([exports.vars], path, false));
    return (0, remeda_1.isString)(name) ? name : undefined;
}
/**
 * Returns a CSS variable declaration string.
 *
 * If `defaultTo` is not provided, returns a string like `var(--likec4-palette-fill)`.
 * If `defaultTo` is a Vars or string, returns a string like `var(--likec4-palette-fill, var(--default-to))`.
 *
 * @param key - The name of the CSS variable to generate.
 * @param defaultTo - An optional string, Vars, or object to use as the default value.
 * @returns A CSS variable declaration string.
 */
function __v(key, defaultTo) {
    var name = readName(key);
    if (!name) {
        throw new Error("Unknown var: ".concat(key));
    }
    if (!defaultTo) {
        return "var(".concat(name, ")");
    }
    var defaultValue = readName(defaultTo);
    if (defaultValue) {
        return "var(".concat(name, ", var(").concat(defaultValue, "))");
    }
    return "var(".concat(name, ", ").concat(defaultTo, ")");
}
