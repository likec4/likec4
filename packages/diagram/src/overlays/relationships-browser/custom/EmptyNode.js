"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmptyNode = EmptyNode;
var jsx_1 = require("@likec4/styles/jsx");
var core_1 = require("@mantine/core");
function EmptyNode(_a) {
    var column = _a.data.column;
    return (<jsx_1.Box css={{
            width: '100%',
            height: '100%',
            border: "3px dashed",
            borderColor: "default.border",
            borderRadius: 'md',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
        }}>
      <core_1.Text c={'dimmed'} fz={'lg'} fw={500}>No {column === 'incomers' ? 'incoming' : 'outgoing'}</core_1.Text>
    </jsx_1.Box>);
}
