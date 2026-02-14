"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_COMPOUND_DEPTH = exports.FitViewPaddings = exports.MaxZoom = exports.MinZoom = exports.ZIndexes = void 0;
exports.ZIndexes = {
    Compound: 1,
    // XYFlow increments zIndexes of compounds
    Edge: 20,
    EdgeLabel: 25,
    Element: 20,
    Max: 30,
};
exports.MinZoom = 0.05;
exports.MaxZoom = 3;
exports.FitViewPaddings = {
    default: '16px',
    withControls: {
        top: '58px',
        left: '16px',
        right: '16px',
        bottom: '16px',
    },
};
exports.MAX_COMPOUND_DEPTH = 5;
