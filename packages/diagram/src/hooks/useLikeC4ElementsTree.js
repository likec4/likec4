"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sortByLabel = void 0;
exports.useLikeC4ElementsTree = useLikeC4ElementsTree;
var utils_1 = require("@likec4/core/utils");
var react_1 = require("react");
var useLikeC4Model_1 = require("./useLikeC4Model");
var sortByLabel = function (a, b) {
    return (0, utils_1.compareNatural)(a.label, b.label);
};
exports.sortByLabel = sortByLabel;
function buildNode(element) {
    return {
        label: element.title || element.id,
        value: element.id,
        children: __spreadArray([], element.children(), true).map(buildNode).sort(exports.sortByLabel),
    };
}
/**
 * Returns a tree of elements in the model.
 * If `viewId` is provided, returns the tree of elements in the view.
 */
function useLikeC4ElementsTree(viewId) {
    var model = (0, useLikeC4Model_1.useLikeC4Model)();
    return (0, react_1.useMemo)(function () {
        if (viewId) {
            var view = model.view(viewId);
            return __spreadArray([], view.roots(), true).map(buildNode).sort(exports.sortByLabel);
        }
        else {
            return __spreadArray([], model.roots(), true).map(buildNode).sort(exports.sortByLabel);
        }
    }, [model, viewId]);
}
