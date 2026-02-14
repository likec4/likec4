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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultTheme = void 0;
var element_colors_ts_1 = require("./element-colors.ts");
var relationship_colors_ts_1 = require("./relationship-colors.ts");
var sizes_ts_1 = require("./sizes.ts");
var types_ts_1 = require("./types.ts");
exports.defaultTheme = __assign({ colors: types_ts_1.ThemeColors.reduce(function (acc, key) {
        acc[key] = {
            elements: element_colors_ts_1.ElementColors[key],
            relationships: relationship_colors_ts_1.RelationshipColors[key],
        };
        return acc;
    }, {}) }, sizes_ts_1.defaultSizes);
__exportStar(require("./element-colors.ts"), exports);
__exportStar(require("./relationship-colors.ts"), exports);
__exportStar(require("./types.ts"), exports);
__exportStar(require("./vars.ts"), exports);
