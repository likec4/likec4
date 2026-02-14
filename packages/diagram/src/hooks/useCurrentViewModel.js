"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useOptionalCurrentViewModel = void 0;
exports.useCurrentViewModel = useCurrentViewModel;
var LikeC4ModelContext_1 = require("../context/LikeC4ModelContext");
Object.defineProperty(exports, "useOptionalCurrentViewModel", { enumerable: true, get: function () { return LikeC4ModelContext_1.useOptionalCurrentViewModel; } });
/**
 * Hook to get the current view model from the context.
 * Throws an error if no view model is found in the context.
 *
 * @see useOptionalCurrentViewModel
 */
function useCurrentViewModel() {
    var vm = (0, LikeC4ModelContext_1.useOptionalCurrentViewModel)();
    if (!vm) {
        throw new Error('No CurrentViewModelContext found');
    }
    return vm;
}
