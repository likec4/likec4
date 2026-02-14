"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeDrifts = NodeDrifts;
var jsx_1 = require("@likec4/styles/jsx");
function NodeDrifts(_a) {
    var data = _a.nodeProps.data;
    var drifts = data.drifts;
    if (!drifts || drifts.length === 0) {
        return null;
    }
    return (<jsx_1.Box className="likec4-node-drifts" css={{
            display: 'contents',
            '& + .likec4-element-shape': {
                outlineColor: 'likec4.compare.manual.outline',
                outlineWidth: '4px',
                outlineStyle: 'dashed',
                outlineOffset: '1.5',
            },
        }}>
    </jsx_1.Box>);
}
