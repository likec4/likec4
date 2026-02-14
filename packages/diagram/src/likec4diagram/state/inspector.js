"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inspector = void 0;
var inspect_1 = require("@statelyai/inspect");
exports.inspector = {
    inspect: import.meta.env.DEV ? (0, inspect_1.createBrowserInspector)().inspect : function () { },
};
