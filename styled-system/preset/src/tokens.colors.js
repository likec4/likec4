"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.colors = void 0;
var dev_1 = require("@pandacss/dev");
var generated_ts_1 = require("./generated.ts");
exports.colors = dev_1.defineTokens.colors({
    mantine: generated_ts_1.tokens.colors.mantine,
    // For typesafety, otherwise wrap with []
    transparent: { value: 'transparent' },
    // For fill: none
    none: { value: 'none' },
    inherit: { value: 'inherit' },
});
