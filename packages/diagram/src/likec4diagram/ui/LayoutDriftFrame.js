"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LayoutDriftFrame = void 0;
var css_1 = require("@likec4/styles/css");
var jsx_1 = require("@likec4/styles/jsx");
var patterns_1 = require("@likec4/styles/patterns");
var core_1 = require("@mantine/core");
var react_1 = require("react");
var useDiagramCompareLayout_1 = require("../../hooks/useDiagramCompareLayout");
exports.LayoutDriftFrame = (0, react_1.memo)(function () {
    var _a = (0, useDiagramCompareLayout_1.useDiagramCompareLayout)(), _b = _a[0], layout = _b.layout, isActive = _b.isActive, toggleCompare = _a[1].toggleCompare;
    var bgColor = layout === 'manual' ? 'var(--mantine-color-orange-6)' : 'var(--mantine-color-green-6)';
    return (<jsx_1.Box className={(0, patterns_1.hstack)({
            position: 'absolute',
            top: '0',
            left: '0',
            width: 'full',
            height: 'full',
            border: "default",
            borderWidth: 4,
            pointerEvents: 'none',
            alignItems: 'flex-start',
            justifyContent: 'center',
        })} style={{
            zIndex: '9999',
            display: !isActive ? 'none' : undefined,
            borderColor: bgColor,
        }}>
      <Btn style={{
            backgroundColor: bgColor,
        }} onClick={function (e) {
            e.stopPropagation();
            toggleCompare();
        }}>
        Close compare
      </Btn>
    </jsx_1.Box>);
});
var Btn = core_1.UnstyledButton.withProps({
    className: (0, css_1.css)({
        fontSize: 'xs',
        fontWeight: 'medium',
        py: '1.5',
        lineHeight: '1',
        borderBottomLeftRadius: 'sm',
        borderBottomRightRadius: 'sm',
        transform: 'translateY(-4px)',
        px: '4',
        color: 'mantine.colors.gray[9]',
        pointerEvents: 'all',
        _active: {
            transform: 'translateY(-3px)',
        },
    }),
});
