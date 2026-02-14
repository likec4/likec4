"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useId = useId;
var hooks_1 = require("@mantine/hooks");
function useId() {
    return (0, hooks_1.useId)().replace('mantine-', 'likec4-');
}
