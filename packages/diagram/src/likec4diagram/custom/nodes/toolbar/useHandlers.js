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
exports.useHandlers = useHandlers;
var react_1 = require("react");
var useCallbackRef_1 = require("../../../../hooks/useCallbackRef");
var useDiagram_1 = require("../../../../hooks/useDiagram");
function useHandlers(target, props) {
    var diagram = (0, useDiagram_1.useDiagram)();
    var _a = (0, react_1.useState)(null), originalColor = _a[0], setOriginalColor = _a[1];
    var onColorPreview = (0, useCallbackRef_1.useCallbackRef)(function (color) {
        if (color === null) {
            if (!originalColor)
                return;
            setOriginalColor(null);
            diagram.updateNodeData(props.data.id, {
                color: originalColor,
            });
            return;
        }
        setOriginalColor(function (value) { return value !== null && value !== void 0 ? value : props.data.color; });
        diagram.updateNodeData(props.data.id, {
            color: color,
        });
    });
    var onChange = (0, useCallbackRef_1.useCallbackRef)(function (change) {
        var shape = change.shape, color = change.color, style = __rest(change, ["shape", "color"]);
        diagram.updateNodeData(props.data.id, __assign(__assign(__assign({}, (shape && { shape: shape })), (color && { color: color })), { style: style }));
        diagram.triggerChange({
            op: 'change-element-style',
            style: change,
            targets: [target],
        });
    });
    return {
        elementColor: originalColor !== null && originalColor !== void 0 ? originalColor : props.data.color,
        onColorPreview: onColorPreview,
        onChange: onChange,
    };
}
