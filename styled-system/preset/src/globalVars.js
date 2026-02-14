"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalVars = void 0;
var const_ts_1 = require("./const.ts");
var index_ts_1 = require("./defaults/index.ts");
var helpers_ts_1 = require("./helpers.ts");
exports.globalVars = {
    extend: (_a = {},
        _a[const_ts_1.vars.font] = '/*-*/ /*-*/',
        _a[const_ts_1.vars.spacing] = '/*-*/ /*-*/',
        _a[const_ts_1.vars.textsize] = (0, helpers_ts_1.rem)(index_ts_1.defaultTheme.textSizes.md),
        // Use the primary color as the default palette
        _a[const_ts_1.vars.palette.fill] = index_ts_1.defaultTheme.colors.primary.elements.fill,
        _a[const_ts_1.vars.palette.stroke] = index_ts_1.defaultTheme.colors.primary.elements.stroke,
        _a[const_ts_1.vars.palette.hiContrast] = index_ts_1.defaultTheme.colors.primary.elements.hiContrast,
        _a[const_ts_1.vars.palette.loContrast] = index_ts_1.defaultTheme.colors.primary.elements.loContrast,
        _a[const_ts_1.vars.palette.relationStroke] = index_ts_1.defaultTheme.colors.gray.relationships.line,
        _a[const_ts_1.vars.palette.relationLabel] = index_ts_1.defaultTheme.colors.gray.relationships.label,
        _a[const_ts_1.vars.palette.relationLabelBg] = index_ts_1.defaultTheme.colors.gray.relationships.labelBg,
        _a[const_ts_1.vars.palette.relationStrokeSelected] = (0, const_ts_1.__v)('palette.relationStroke'),
        _a['--mantine-scale'] = '1',
        _a[const_ts_1.vars.palette.outline] = (0, const_ts_1.__v)('palette.loContrast'),
        _a['--text-fz'] = '/*-*/ /*-*/',
        _a[const_ts_1.vars.icon.color] = '/*-*/ /*-*/',
        _a[const_ts_1.vars.icon.size] = '/*-*/ /*-*/',
        _a),
};
