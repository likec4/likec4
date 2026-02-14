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
exports.patterns = void 0;
var dev_1 = require("@pandacss/dev");
var types_1 = require("./defaults/types");
var txt = (0, dev_1.definePattern)({
    properties: {
        inline: {
            type: 'boolean',
        },
        dimmed: {
            type: 'boolean',
        },
        lh: {
            type: 'token',
            value: 'lineHeights',
        },
        size: {
            type: 'enum',
            value: ['xxs', 'xs', 'sm', 'md', 'lg', 'xl'],
        },
        likec4color: {
            type: 'enum',
            value: __spreadArray([], types_1.ThemeColors, true),
        },
    },
    defaultValues: {
        inline: false,
        dimmed: false,
        size: 'md',
    },
    transform: function (props, _helpers) {
        var inline = props.inline, size = props.size, dimmed = props.dimmed, lh = props.lh, likec4color = props.likec4color, rest = __rest(props, ["inline", "size", "dimmed", "lh", "likec4color"]);
        if (dimmed && likec4color) {
            throw new Error('dimmed and likec4color are mutually exclusive');
        }
        return __assign(__assign(__assign(__assign({ userSelect: 'all', cursor: 'default', textStyle: dimmed ? "dimmed.".concat(size) : size }, (inline && { display: 'inline-block' })), (lh && { lineHeight: lh })), (likec4color && { 'data-likec4-color': likec4color })), rest);
    },
    jsxElement: 'div',
    jsxName: 'Txt',
    jsx: ['Txt'],
});
exports.patterns = {
    extend: {
        vstack: {
            defaultValues: {
                alignItems: 'stretch',
                gap: 'sm',
            },
        },
        hstack: {
            defaultValues: {
                gap: 'sm',
            },
        },
        box: {
            jsx: ['Box', 'MarkdownBlock'],
        },
        txt: txt,
    },
};
