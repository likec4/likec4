"use strict";
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
exports.PanelActionIcon = exports.Breadcrumbs = exports.BreadcrumbsSeparator = exports.Tooltip = void 0;
var css_1 = require("@likec4/styles/css");
var recipes_1 = require("@likec4/styles/recipes");
var core_1 = require("@mantine/core");
var icons_react_1 = require("@tabler/icons-react");
var m = require("motion/react-m");
var react_1 = require("react");
exports.Tooltip = core_1.Tooltip.withProps({
    color: 'dark',
    fz: 'xs',
    openDelay: 600,
    closeDelay: 120,
    label: '',
    children: null,
    offset: 8,
    withinPortal: false,
});
var BreadcrumbsSeparator = function () { return (<core_1.ThemeIcon variant="transparent" size={16} className={(0, css_1.css)({
        display: {
            base: 'none',
            '@/md': 'flex',
        },
        color: {
            base: 'mantine.colors.gray[5]',
            _dark: 'mantine.colors.dark[3]',
        },
    })}>
    <icons_react_1.IconChevronRight />
  </core_1.ThemeIcon>); };
exports.BreadcrumbsSeparator = BreadcrumbsSeparator;
exports.Breadcrumbs = core_1.Breadcrumbs.withProps({
    separator: <exports.BreadcrumbsSeparator />,
    separatorMargin: 4,
});
exports.PanelActionIcon = (0, react_1.forwardRef)(function (_a, ref) {
    var _b = _a.variant, variant = _b === void 0 ? 'default' : _b, className = _a.className, _c = _a.disabled, disabled = _c === void 0 ? false : _c, type = _a.type, others = __rest(_a, ["variant", "className", "disabled", "type"]);
    return (<core_1.ActionIcon size="md" variant="transparent" radius="sm" component={m.button} {...!disabled && {
        whileHover: {
            scale: 1.085,
        },
        whileTap: {
            scale: 1,
            translateY: 1,
        },
    }} disabled={disabled} {...others} className={(0, css_1.cx)(className, (0, recipes_1.navigationPanelActionIcon)({ variant: variant, type: type }))} ref={ref}/>);
});
