"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Background = void 0;
var core_1 = require("@likec4/core");
var react_1 = require("@xyflow/react");
var fast_equals_1 = require("fast-equals");
var react_2 = require("react");
function literalToEnum(value) {
    switch (value) {
        case 'dots':
            return react_1.BackgroundVariant.Dots;
        case 'lines':
            return react_1.BackgroundVariant.Lines;
        case 'cross':
            return react_1.BackgroundVariant.Cross;
        default:
            (0, core_1.nonexhaustive)(value);
    }
}
var compareProps = function (prev, next) {
    if (typeof prev.background === 'string' && typeof next.background === 'string') {
        return prev.background === next.background;
    }
    return (0, fast_equals_1.deepEqual)(prev.background, next.background);
};
exports.Background = (0, react_2.memo)(function (_a) {
    var background = _a.background;
    if (typeof background === 'string') {
        return <react_1.Background variant={literalToEnum(background)} size={2} gap={20}/>;
    }
    return <react_1.Background {...background}/>;
}, compareProps);
exports.Background.displayName = 'Background';
