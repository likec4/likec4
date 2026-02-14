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
exports.stopAndPrevent = stopAndPrevent;
exports.centerY = centerY;
exports.moveFocusToSearchInput = moveFocusToSearchInput;
exports.focusToFirstFoundElement = focusToFirstFoundElement;
exports.queryAllFocusable = queryAllFocusable;
exports.whenSearchAnimationEnds = whenSearchAnimationEnds;
var remeda_1 = require("remeda");
var _shared_css_1 = require("./_shared.css");
function stopAndPrevent(e) {
    e.stopPropagation();
    e.preventDefault();
    return;
}
function centerY(element) {
    var rect = element.getBoundingClientRect();
    var y = rect.y + Math.floor(rect.height / 2);
    return y;
}
function moveFocusToSearchInput(from) {
    if (!from) {
        console.error('moveFocusToSearchInput: from is null or undefined');
        return;
    }
    var root = from.getRootNode();
    if (!(0, remeda_1.isFunction)(root.querySelector)) {
        console.error('moveFocusToSearchInput: root.querySelector is not a function');
        return;
    }
    var input = root.querySelector('[data-likec4-search-input]');
    if (input) {
        var length_1 = input.value.length;
        input.focus();
        input.setSelectionRange(length_1, length_1);
    }
}
function focusToFirstFoundElement(from) {
    if (!from) {
        console.error('focusToFirstFoundElement: from is null or undefined');
        return;
    }
    var root = from.getRootNode();
    if (!(0, remeda_1.isFunction)(root.querySelector)) {
        console.error('focusToFirstFoundElement: root.querySelector is not a function');
        return;
    }
    var firstFoundElement = root.querySelector("[data-likec4-search] .".concat(_shared_css_1.focusable));
    firstFoundElement === null || firstFoundElement === void 0 ? void 0 : firstFoundElement.focus();
}
function queryAllFocusable(from, where, selector) {
    if (selector === void 0) { selector = ".".concat(_shared_css_1.focusable); }
    if (!from) {
        console.error('queryAllFocusable: from is null or undefined');
        return [];
    }
    var root = from.getRootNode();
    if (!(0, remeda_1.isFunction)(root.querySelectorAll)) {
        console.error('queryAllFocusable: root.querySelectorAll is not a function');
        return [];
    }
    var elements = root.querySelectorAll("[data-likec4-search-".concat(where, "] ").concat(selector));
    return __spreadArray([], elements, true);
}
/**
 * Workaround: defers execution of the callback, to finish search panel close animation.
 * Otherwise, there could be weird artifacts when navigating to large diagrams.
 * @todo Find a better way to handle this, possibly with animationend event.
 */
function whenSearchAnimationEnds(callback) {
    setTimeout(callback, 400);
}
