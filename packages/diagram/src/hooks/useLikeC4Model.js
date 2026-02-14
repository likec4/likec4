"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useOptionalLikeC4Model = void 0;
exports.useLikeC4Model = useLikeC4Model;
exports.useLikeC4ViewModel = useLikeC4ViewModel;
exports.useLikeC4Specification = useLikeC4Specification;
var fast_equals_1 = require("fast-equals");
var react_1 = require("react");
var LikeC4ModelContext_1 = require("../context/LikeC4ModelContext");
Object.defineProperty(exports, "useOptionalLikeC4Model", { enumerable: true, get: function () { return LikeC4ModelContext_1.useOptionalLikeC4Model; } });
/**
 * @returns The LikeC4Model from context.
 * @throws If no LikeC4ModelProvider is found.
 */
function useLikeC4Model() {
    var model = (0, LikeC4ModelContext_1.useOptionalLikeC4Model)();
    if (!model) {
        throw new Error('LikeC4Model not found. Make sure you have LikeC4ModelProvider.');
    }
    return model;
}
function useLikeC4ViewModel(viewId) {
    var model = useLikeC4Model();
    return model.view(viewId);
}
function useLikeC4Specification() {
    var model = useLikeC4Model();
    var _specification = model.specification;
    var _a = (0, react_1.useState)(_specification), specification = _a[0], setSpecification = _a[1];
    (0, react_1.useEffect)(function () {
        setSpecification(function (current) { return (0, fast_equals_1.deepEqual)(current, _specification) ? current : _specification; });
    }, [_specification]);
    return specification;
}
