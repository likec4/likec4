"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.semanticTokens = void 0;
var dev_1 = require("@pandacss/dev");
var tokens_semantic_colors_ts_1 = require("./tokens-semantic.colors.ts");
exports.semanticTokens = (0, dev_1.defineSemanticTokens)({
    colors: tokens_semantic_colors_ts_1.colors,
});
