"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultHandles = DefaultHandles;
var core_1 = require("@likec4/core");
var react_1 = require("@xyflow/react");
/**
 * XYFlow requires handles to be defined on nodes.
 */
function DefaultHandles(_a) {
    var _b = _a.direction, direction = _b === void 0 ? 'TB' : _b;
    var sourcePosition, targetPosition;
    switch (direction) {
        case 'TB': {
            sourcePosition = react_1.Position.Bottom;
            targetPosition = react_1.Position.Top;
            break;
        }
        case 'BT': {
            sourcePosition = react_1.Position.Top;
            targetPosition = react_1.Position.Bottom;
            break;
        }
        case 'LR': {
            sourcePosition = react_1.Position.Right;
            targetPosition = react_1.Position.Left;
            break;
        }
        case 'RL': {
            sourcePosition = react_1.Position.Left;
            targetPosition = react_1.Position.Right;
            break;
        }
        default: {
            (0, core_1.nonexhaustive)(direction);
        }
    }
    return (<>
      <react_1.Handle type={'source'} position={sourcePosition} className="likec4-node-handle-center"/>
      <react_1.Handle type={'target'} position={targetPosition} className="likec4-node-handle-center"/>
    </>);
}
