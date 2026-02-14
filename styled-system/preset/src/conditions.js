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
Object.defineProperty(exports, "__esModule", { value: true });
exports.conditions = void 0;
var remeda_1 = require("remeda");
var const_ts_1 = require("./const.ts");
var index_ts_1 = require("./defaults/index.ts");
var shapeSizeCondition = function (key) {
    return "shapeSize".concat((0, remeda_1.capitalize)(key));
};
exports.conditions = {
    extend: __assign(__assign(__assign({}, (0, remeda_1.pipe)(index_ts_1.defaultTheme.sizes, (0, remeda_1.mapValues)(function (_, key) { return ":where([data-likec4-shape-size='".concat(key, "']) &"); }), (0, remeda_1.mapKeys)(shapeSizeCondition))), (0, remeda_1.mapToObj)(index_ts_1.ElementShapes, function (shape) { return [
        'shape' + (0, remeda_1.capitalize)(shape),
        ":where([data-likec4-shape='".concat(shape, "']) &"),
    ]; })), { light: '[data-mantine-color-scheme="light"] &', dark: '[data-mantine-color-scheme="dark"] &', notDisabled: '&:not(:is(:disabled, [disabled], [data-disabled]))', 
        // This is used to hide certain elements when the diagram is in reduced graphics mode (large)
        reduceGraphics: [
            "".concat(const_ts_1.root, ":is([data-likec4-reduced-graphics])"),
            ' &',
        ].join(''), 
        // This is used to improve performance when the diagram is in reduced graphics mode
        // and the user is panning around the diagram
        reduceGraphicsOnPan: [
            "".concat(const_ts_1.root, ":is("),
            '[data-likec4-reduced-graphics]',
            '[data-likec4-diagram-panning="true"]',
            ') &',
        ].join(''), noReduceGraphics: [
            "".concat(const_ts_1.root, ":not("),
            '[data-likec4-reduced-graphics]',
            ') &',
        ].join(''), whenPanning: "".concat(const_ts_1.root, ":is([data-likec4-diagram-panning=\"true\"]) &"), smallZoom: ':where([data-likec4-zoom-small="true"]) &', compoundTransparent: ':where([data-compound-transparent]) &', edgeActive: ':where([data-likec4-edge-active="true"]) &', whenHovered: ':where([data-likec4-hovered="true"]) &', whenSelectable: ':where(.react-flow__node, .react-flow__edge, .likec4-edge-container):is(.selectable) &', whenSelected: ':where(.react-flow__node, .react-flow__edge, .likec4-edge-container):is(.selected) &', whenDimmed: ':where(.react-flow__node, .react-flow__edge):has([data-likec4-dimmed]) &', whenFocused: ':where(.react-flow__node, .react-flow__edge):is(:focus-visible, :focus, :focus-within) &' }),
};
