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
exports.NavigationLink = void 0;
var css_1 = require("@likec4/styles/css");
var recipes_1 = require("@likec4/styles/recipes");
var core_1 = require("@mantine/core");
var react_1 = require("react");
exports.NavigationLink = (0, react_1.forwardRef)(function (_a, ref) {
    var className = _a.className, _b = _a.truncateLabel, truncateLabel = _b === void 0 ? true : _b, others = __rest(_a, ["className", "truncateLabel"]);
    return (<core_1.NavLink {...others} component="button" classNames={(0, recipes_1.navigationLink)({
            truncateLabel: truncateLabel,
        })} className={(0, css_1.cx)('group', 'mantine-active', className)} ref={ref}/>);
});
exports.NavigationLink.displayName = 'NavigationLink';
