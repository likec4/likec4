"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentViewModelProvider = CurrentViewModelProvider;
var useCurrentView_1 = require("../hooks/useCurrentView");
var LikeC4ModelContext_1 = require("./LikeC4ModelContext");
function CurrentViewModelProvider(_a) {
    var _b;
    var children = _a.children;
    { /* Important - we use "viewId" from actor context, not from props */ }
    var viewId = (0, useCurrentView_1.useCurrentViewId)();
    var likec4model = (0, LikeC4ModelContext_1.useOptionalLikeC4Model)();
    var viewmodel = (_b = likec4model === null || likec4model === void 0 ? void 0 : likec4model.findView(viewId)) !== null && _b !== void 0 ? _b : null;
    return (<LikeC4ModelContext_1.CurrentViewModelContext value={viewmodel}>
      {children}
    </LikeC4ModelContext_1.CurrentViewModelContext>);
}
