"use strict";
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", { value: true });
exports.elementViewsCount = exports.elementIcon = exports.elementId = exports.elementTitleAndId = exports.elementExpandIcon = exports.treeSubtree = exports.treeLabel = exports.treeRoot = exports.treeNode = exports.focusable = void 0;
var css_1 = require("@likec4/styles/css");
var patterns_1 = require("@likec4/styles/patterns");
var _shared_css_1 = require("./_shared.css");
Object.defineProperty(exports, "focusable", { enumerable: true, get: function () { return _shared_css_1.focusable; } });
var whenContainerIsNarrow = "@container likec4-tree (max-width: 450px)";
exports.treeNode = (0, css_1.css)({
    outline: 'none',
    marginBottom: '2',
});
exports.treeRoot = (0, css_1.css)(patterns_1.container.raw({
    containerName: 'likec4-tree',
}), {
    containerType: 'inline-size',
    height: '100%',
});
exports.treeLabel = (0, css_1.css)({
    display: 'flex',
    alignItems: 'baseline',
    outline: 'none !important',
    gap: '1',
});
exports.treeSubtree = (0, css_1.css)({
    marginTop: '2',
});
exports.elementExpandIcon = (0, css_1.css)({
    color: 'text.dimmed',
});
exports.elementTitleAndId = (0, css_1.css)((_a = {},
    _a[whenContainerIsNarrow] = {
        flexDirection: 'column-reverse',
        alignItems: 'flex-start',
        gap: '0.5',
    },
    _a));
// export const elementTitle = css(title)
exports.elementId = (0, css_1.css)({
    // color: `[var(${descriptionColor}, {colors.text.dimmed})]`,
    fontSize: '10px',
    lineHeight: '1.3',
    display: 'block',
    fontWeight: 'medium',
    whiteSpace: 'nowrap',
    padding: '[1px 5px]',
    borderRadius: 'sm',
    background: "mantine.colors.dark[9]/30",
    _light: {
        background: "mantine.colors.gray[3]/20",
    },
});
exports.elementIcon = (0, css_1.css)((_b = {},
    _b['--likec4-icon-size'] = '24px',
    _b[whenContainerIsNarrow] = (_c = {},
        _c['--likec4-icon-size'] = '18px',
        _c),
    _b));
exports.elementViewsCount = (0, css_1.css)((_d = {
        flex: 0,
        // color: `[var(${descriptionColor}, {colors.text.dimmed})]`,
        fontSize: '10px',
        fontWeight: 'medium',
        whiteSpace: 'nowrap',
        lineHeight: '1.1'
    },
    _d[whenContainerIsNarrow] = {
        display: 'none',
    },
    _d));
