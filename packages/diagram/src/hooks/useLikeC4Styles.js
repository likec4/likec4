"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useLikeC4Styles = useLikeC4Styles;
var styles_1 = require("@likec4/core/styles");
var LikeC4ModelContext_1 = require("../context/LikeC4ModelContext");
function useLikeC4Styles() {
    var _a;
    var model = (0, LikeC4ModelContext_1.useOptionalLikeC4Model)();
    return (_a = model === null || model === void 0 ? void 0 : model.$styles) !== null && _a !== void 0 ? _a : styles_1.LikeC4Styles.DEFAULT;
}
