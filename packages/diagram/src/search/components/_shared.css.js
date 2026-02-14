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
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", { value: true });
exports.buttonsva = exports.emptyBoX = exports.focusable = void 0;
var css_1 = require("@likec4/styles/css");
// export const titleColor = '--title-color'
// export const descriptionColor = '---description-color'
// export const iconColor = '--icon-color'
var buttonFocused = css_1.css.raw({
    outline: 'none',
    background: 'mantine.colors.primary[8]',
    borderColor: 'mantine.colors.primary[9]',
});
var _treenodefocus = '.mantine-Tree-node:focus > .mantine-Tree-label &';
var button = css_1.css.raw((_a = {
        display: 'flex',
        width: '100%',
        background: 'body',
        rounded: 'sm',
        padding: "[12px 8px 12px 14px]",
        minHeight: '60px',
        gap: '2',
        // alignItems: 'flex-start',
        // transition: `all 50ms ${easings.inOut}`,
        border: "1px solid",
        borderColor: 'default.border',
        // [titleColor]: '{colors.mantine.colors.dark[1]}',
        // [iconColor]: '{colors.text.dimmed}',
        // [descriptionColor]: '{colors.text.dimmed}',
        _hover: __assign(__assign({}, buttonFocused), { borderColor: 'mantine.colors.primary[9]', background: "mantine.colors.primary[8]/60" }),
        _focus: buttonFocused
    },
    _a[_treenodefocus] = buttonFocused,
    _a._dark = {
        borderColor: 'transparent',
        background: "mantine.colors.dark[6]/80",
        // background: 'mantine.colors.dark[6]',
    },
    _a._light = {
        background: "mantine.colors.white/80",
        // [iconColor]: '{colors.mantine.colors.gray[6]}',
        // [titleColor]: '{colors.mantine.colors.gray[7]}',
        _hover: {
            borderColor: 'mantine.colors.primary[6]',
            backgroundColor: 'mantine.colors.primary[5]',
            // [iconColor]: '{colors.mantine.colors.primary[3])',
            // [titleColor]: '{colors.mantine.colors.primary[0])',
            // [descriptionColor]: '{colors.mantine.colors.primary[1]}',
        },
    },
    _a));
exports.focusable = 'likec4-focusable';
var iconSize = {
    ref: 'var(--likec4-icon-size, 24px)',
};
var icon = css_1.css.raw((_b = {
        color: {
            base: 'text.dimmed',
            _light: 'mantine.colors.gray[5]',
            _groupHover: 'mantine.colors.primary[0]',
            _groupFocus: 'mantine.colors.primary[0]',
        }
    },
    _b[_treenodefocus] = {
        color: 'mantine.colors.primary[0]',
    },
    _b.flex = "0 0 ".concat(iconSize.ref),
    _b.height = iconSize.ref,
    _b.width = iconSize.ref,
    _b.display = 'flex',
    _b.alignItems = 'center',
    _b.justifyContent = 'center',
    _b.alignSelf = 'flex-start',
    _b['--ti-size'] = iconSize.ref,
    _b["& svg, & img"] = {
        width: '100%',
        height: 'auto',
        maxHeight: '100%',
        pointerEvents: 'none',
    },
    _b["& img"] = {
        objectFit: 'contain',
    },
    _b['&.likec4-shape-icon svg'] = {
        // color: `[var(${iconColor})]`,
        strokeWidth: 1.5,
    },
    _b));
var title = css_1.css.raw((_c = {
        fontSize: '16px',
        fontWeight: 'medium',
        lineHeight: '1.1'
    },
    _c[":where([data-disabled]) &"] = {
        opacity: 0.4,
    },
    _c.color = {
        base: 'mantine.colors.dark[1]',
        _light: 'mantine.colors.gray[7]',
        _groupHover: {
            base: 'mantine.colors.primary[1]',
            _light: 'white',
        },
        _groupFocus: {
            base: 'mantine.colors.primary[1]',
            _light: 'white',
        },
    },
    _c[_treenodefocus] = {
        color: {
            base: 'mantine.colors.primary[1]',
            _light: 'white',
        },
    },
    _c));
var descriptionColor = css_1.css.raw((_d = {
        color: {
            base: 'text.dimmed',
            _groupHover: {
                base: 'mantine.colors.primary[1]',
                _light: 'mantine.colors.primary[0]',
            },
            _groupFocus: 'mantine.colors.primary[0]',
        }
    },
    _d[_treenodefocus] = {
        color: 'mantine.colors.primary[0]',
    },
    _d));
var description = css_1.css.raw(descriptionColor, (_e = {
        marginTop: '1',
        fontSize: '12px',
        lineHeight: '1.4'
    },
    _e[":where([data-disabled]) &"] = {
        opacity: 0.85,
    },
    _e));
exports.emptyBoX = (0, css_1.css)({
    width: '100%',
    height: '100%',
    border: "2px dashed",
    borderColor: 'default.border',
    rounded: 'md',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 'md',
    color: 'text.dimmed',
    padding: 'md',
    paddingBlock: 'xl',
});
exports.buttonsva = (0, css_1.sva)({
    slots: ['root', 'icon', 'title', 'description', 'descriptionColor'],
    className: 'search-button',
    base: {
        root: button,
        icon: icon,
        title: title,
        description: description,
        descriptionColor: descriptionColor,
    },
});
