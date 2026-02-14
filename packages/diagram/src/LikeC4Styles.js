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
exports.LikeC4Styles = LikeC4Styles;
var core_1 = require("@mantine/core");
var react_1 = require("react");
var remeda_1 = require("remeda");
var const_1 = require("./base/const");
var useLikeC4Styles_1 = require("./hooks/useLikeC4Styles");
var scheme = function (scheme) { return "[data-mantine-color-scheme=\"".concat(scheme, "\"]"); };
var whenDark = scheme('dark');
var generateCompoundColors = function (rootSelector, name, colors, depth) {
    var selector = "".concat(rootSelector, " :is([data-likec4-color=\"").concat(name, "\"][data-compound-depth=\"").concat(depth, "\"])");
    return "\n".concat(selector, " {\n  --likec4-palette-fill: ").concat(colors.fill, ";\n  --likec4-palette-stroke: ").concat(colors.stroke, ";  \n}\n  ");
};
function toStyle(styles, params) {
    var rootSelector = params.rootSelector, name = params.name, colors = params.colors;
    var elements = colors.elements, relationships = colors.relationships;
    var selector = "".concat(rootSelector, " :is([data-likec4-color=").concat(name, "])");
    return __spreadArray([
        "\n".concat(selector, " {\n  --likec4-palette-fill: ").concat(elements.fill, ";\n  --likec4-palette-stroke: ").concat(elements.stroke, ";\n  --likec4-palette-hiContrast: ").concat(elements.hiContrast, ";\n  --likec4-palette-loContrast: ").concat(elements.loContrast, ";\n  --likec4-palette-relation-stroke: ").concat(relationships.line, ";\n  --likec4-palette-relation-label: ").concat(relationships.label, ";\n  --likec4-palette-relation-label-bg: ").concat(relationships.labelBg, ";\n  --likec4-palette-relation-stroke-selected: oklch(from ").concat(relationships.line, " calc(l - 0.15) c h);\n}\n").concat(whenDark, " ").concat(selector, " {\n  --likec4-palette-relation-stroke-selected: oklch(from ").concat(relationships.line, " calc(l + 0.15) c h);\n}\n\n  ")
    ], styles.colorsForCompounds(elements, const_1.MAX_COMPOUND_DEPTH).map(function (colors, depth) {
        return generateCompoundColors(rootSelector, name, colors, depth + 1);
    }), true).map(function (s) { return s.trim(); }).join('\n');
}
function generateBuiltInColorStyles(styles, rootSelector) {
    return (0, remeda_1.pipe)(styles.theme.colors, (0, remeda_1.entries)(), (0, remeda_1.map)(function (_a) {
        var name = _a[0], colors = _a[1];
        return toStyle(styles, {
            rootSelector: rootSelector,
            name: name,
            colors: colors,
        });
    }), (0, remeda_1.join)('\n'));
}
function LikeC4Styles(_a) {
    var _b;
    var id = _a.id;
    var rootSelector = "#".concat(id);
    var nonce = (_b = (0, core_1.useMantineStyleNonce)()) === null || _b === void 0 ? void 0 : _b();
    var $styles = (0, useLikeC4Styles_1.useLikeC4Styles)();
    var colorsStyles = (0, react_1.useMemo)(function () { return generateBuiltInColorStyles($styles, rootSelector); }, [rootSelector, $styles]);
    return (<MemoizedStyle id={id} nonce={nonce} colorsStyles={colorsStyles}/>);
}
/**
 * @internal Memoized styles gives a performance boost during development
 */
var MemoizedStyle = (0, react_1.memo)(function (_a) {
    var id = _a.id, nonce = _a.nonce, colorsStyles = _a.colorsStyles;
    return (<style type="text/css" data-likec4-colors={id} dangerouslySetInnerHTML={{ __html: colorsStyles }} nonce={nonce}/>);
});
MemoizedStyle.displayName = 'MemoizedStyle';
