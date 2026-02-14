"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelationshipTitle = exports.Endpoint = void 0;
var jsx_1 = require("@likec4/styles/jsx");
var patterns_1 = require("@likec4/styles/patterns");
var Endpoint = function (_a) {
    var children = _a.children, likec4color = _a.likec4color;
    return (<div data-likec4-color={likec4color} className={(0, patterns_1.txt)({
            size: 'xxs',
            fontWeight: 'medium',
            whiteSpace: 'nowrap',
            paddingX: '1',
            paddingY: '0.5',
            rounded: 'xs',
            background: {
                _light: 'var(--likec4-palette-fill)/90',
                _dark: 'var(--likec4-palette-fill)/60',
            },
            color: {
                _light: 'var(--likec4-palette-hiContrast)',
                _dark: 'var(--likec4-palette-loContrast)',
            },
        })}>
      {children}
    </div>);
};
exports.Endpoint = Endpoint;
exports.RelationshipTitle = (0, jsx_1.styled)('div', {
    base: {
        whiteSpaceCollapse: 'preserve-breaks',
        fontSize: 'sm',
        lineHeight: 'sm',
        userSelect: 'all',
    },
});
