"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.viewButtonDescription = exports.viewButton = exports.focusable = exports.emptyBoX = void 0;
var css_1 = require("@likec4/styles/css");
var _shared_css_1 = require("./_shared.css");
Object.defineProperty(exports, "emptyBoX", { enumerable: true, get: function () { return _shared_css_1.emptyBoX; } });
Object.defineProperty(exports, "focusable", { enumerable: true, get: function () { return _shared_css_1.focusable; } });
var _viewBtn = 'likec4-view-btn';
exports.viewButton = (0, css_1.cx)((0, css_1.css)({
    flexWrap: 'nowrap',
    display: 'flex',
    // '& .mantine-ThemeIcon-root': {
    //   color: `[var(${iconColor}, {colors.mantine.colors.dark[2]})]`,
    //   '--ti-size': '24px',
    // },
    '&[data-disabled] .mantine-ThemeIcon-root': {
        opacity: 0.45,
    },
}), _viewBtn);
// export const viewTitle = css(title)
// export const viewDescription = css(description)
exports.viewButtonDescription = (0, css_1.css)((_a = {
        marginTop: '1',
        // transition: transitions.fast,
        // color: `[var(${descriptionColor}, {colors.text.dimmed})]`,
        fontSize: '13px',
        lineHeight: '1.4'
    },
    _a[":where(.likec4-view-btn[data-disabled]) &"] = {
        opacity: 0.85,
    },
    _a));
