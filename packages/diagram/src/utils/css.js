"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVarName = getVarName;
function getVarName(variable) {
    var matches = variable.match(/^var\((.*)\)$/);
    if (matches) {
        return matches[1];
    }
    return variable;
}
