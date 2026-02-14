"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EdgeDrifts = EdgeDrifts;
var css_1 = require("@likec4/styles/css");
function EdgeDrifts(_a) {
    var data = _a.edgeProps.data, svgPath = _a.svgPath;
    var drifts = data.drifts;
    if (!drifts || drifts.length === 0) {
        return null;
    }
    return (<path className={(0, css_1.cx)('react-flow__edge-path', (0, css_1.css)({
            pointerEvents: 'none',
            stroke: 'likec4.compare.manual.outline',
            fill: 'none',
            strokeWidth: {
                base: '8px',
                _whenHovered: '12px',
            },
            strokeOpacity: 0.5,
        }))} d={svgPath} strokeLinecap="round"/>);
}
