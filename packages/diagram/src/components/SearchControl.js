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
exports.SearchControl = SearchControl;
var css_1 = require("@likec4/styles/css");
var core_1 = require("@mantine/core");
var icons_react_1 = require("@tabler/icons-react");
var system_1 = require("@xyflow/system");
var classes = require("./SearchControl.css");
function SearchControl(_a) {
    var className = _a.className, others = __rest(_a, ["className"]);
    var isMac = (0, system_1.isMacOs)();
    return (<core_1.UnstyledButton {...others} className={(0, css_1.cx)('group', classes.root, className)}>
      <core_1.Group gap="xs">
        <icons_react_1.IconSearch style={{ width: '15px', height: '15px' }} stroke={2}/>
        <core_1.Text component="div" className={classes.placeholder}>
          Search
        </core_1.Text>
        <core_1.Text component="div" className={classes.shortcut}>
          {isMac ? '⌘ + K' : 'Ctrl + K'}
        </core_1.Text>
      </core_1.Group>
    </core_1.UnstyledButton>);
}
