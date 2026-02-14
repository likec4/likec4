"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.elementNode = void 0;
var dev_1 = require("@pandacss/dev");
exports.elementNode = (0, dev_1.defineRecipe)({
    className: 'likec4-element-node',
    jsx: ['ElementNodeContainer', 'ElementNode'],
    base: (_a = {
            position: 'relative',
            width: 'full',
            height: 'full',
            padding: '0',
            margin: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            _focusVisible: {
                outline: 'none',
            },
            _whenSelectable: {
                pointerEvents: 'all',
                _before: {
                    content: '" "',
                    position: 'absolute',
                    top: 'calc(100% - 4px)',
                    left: '0',
                    width: 'full',
                    height: '24px',
                    background: 'transparent',
                    pointerEvents: 'all',
                },
            },
            _reduceGraphicsOnPan: {
                _before: {
                    display: 'none',
                },
            }
        },
        _a[":where(.react-flow__node.selectable:not(.dragging)) &"] = {
            cursor: 'pointer',
        },
        _a["&:is([data-likec4-shape=\"document\"])"] = {
            paddingBottom: '16px',
        },
        _a),
    staticCss: [{
            conditions: ['*'],
        }],
});
