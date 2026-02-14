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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Markdown = void 0;
var css_1 = require("@likec4/styles/css");
var jsx_1 = require("@likec4/styles/jsx");
var recipes_1 = require("@likec4/styles/recipes");
var core_1 = require("@mantine/core");
var react_1 = require("react");
exports.Markdown = (0, react_1.forwardRef)(function (_a, ref) {
    var _b;
    var value = _a.value, _c = _a.textScale, textScale = _c === void 0 ? 1 : _c, _d = _a.uselikec4palette, uselikec4palette = _d === void 0 ? false : _d, _e = _a.hideIfEmpty, hideIfEmpty = _e === void 0 ? false : _e, _f = _a.emptyText, emptyText = _f === void 0 ? 'no content' : _f, className = _a.className, style = _a.style, fontSize = _a.fontSize, props = __rest(_a, ["value", "textScale", "uselikec4palette", "hideIfEmpty", "emptyText", "className", "style", "fontSize"]);
    if (value.isEmpty && hideIfEmpty) {
        return null;
    }
    var content = value.nonEmpty
        ? value.isMarkdown
            ? { dangerouslySetInnerHTML: { __html: value.html } }
            : { children: <p>{value.text}</p> }
        : { children: <core_1.Text component="span" fz={'xs'} c="dimmed" style={{ userSelect: 'none' }}>{emptyText}</core_1.Text> };
    return (<jsx_1.Box {...props} ref={ref} className={(0, css_1.cx)((0, recipes_1.markdownBlock)({
            uselikec4palette: uselikec4palette,
            value: value.isMarkdown ? 'markdown' : 'plaintext',
        }), className)} style={__assign(__assign(__assign({}, style), (fontSize && {
            '--text-fz': "var(--font-sizes-".concat(fontSize, ", var(--font-sizes-md))"),
        })), (textScale !== 1 && (_b = {},
            _b['--mantine-scale'] = textScale,
            _b)))} {...content}/>);
});
exports.Markdown.displayName = 'Markdown';
