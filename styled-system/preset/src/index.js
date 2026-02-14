"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vars = exports.theme = void 0;
var dev_1 = require("@pandacss/dev");
var animations_ts_1 = require("./animations.ts");
var conditions_ts_1 = require("./conditions.ts");
var vars_ts_1 = require("./defaults/vars.ts");
var generated_ts_1 = require("./generated.ts");
var globalCss_ts_1 = require("./globalCss.ts");
var globalVars_ts_1 = require("./globalVars.ts");
var layer_styles_ts_1 = require("./layer-styles.ts");
var patterns_ts_1 = require("./patterns.ts");
var radixColors_ts_1 = require("./radixColors.ts");
var recipes = require("./recipes/index.ts");
var slotRecipes = require("./stot-recipes/index.ts");
var text_styles_ts_1 = require("./text-styles.ts");
var tokens_semantic_ts_1 = require("./tokens-semantic.ts");
var tokens_ts_1 = require("./tokens.ts");
var utilities_ts_1 = require("./utilities.ts");
exports.theme = {
    breakpoints: generated_ts_1.breakpoints,
    textStyles: text_styles_ts_1.textStyles,
    layerStyles: layer_styles_ts_1.layerStyles,
    tokens: tokens_ts_1.tokens,
    semanticTokens: tokens_semantic_ts_1.semanticTokens,
    recipes: recipes,
    slotRecipes: slotRecipes,
    containerNames: ['likec4-root', 'likec4-dialog'],
    containerSizes: {
        xs: '384px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
    },
    keyframes: animations_ts_1.keyframes,
    animationStyles: animations_ts_1.animationStyles,
};
exports.default = (0, dev_1.definePreset)({
    name: 'likec4',
    presets: [
        radixColors_ts_1.radixColorsPreset,
    ],
    globalVars: globalVars_ts_1.globalVars,
    globalCss: globalCss_ts_1.globalCss,
    staticCss: {
        extend: {
            themes: ['light', 'dark'],
        },
    },
    conditions: conditions_ts_1.conditions,
    patterns: patterns_ts_1.patterns,
    utilities: utilities_ts_1.utilities,
    theme: {
        extend: exports.theme,
    },
});
exports.vars = {
    likec4: vars_ts_1.vars,
    mantine: generated_ts_1.mantine,
};
