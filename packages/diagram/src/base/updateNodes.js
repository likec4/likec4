"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateNodes = updateNodes;
var system_1 = require("@xyflow/system");
var fast_equals_1 = require("fast-equals");
var remeda_1 = require("remeda");
var EMPTY_OBJ = {};
function _update(current, updated) {
    if (current === updated) {
        return current;
    }
    updated = updated.map(function (update) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v;
        var existing = current.find(function (n) { return n.id === update.id && n.type === update.type; });
        if (!existing) {
            return update;
        }
        if (existing === update) {
            return existing;
        }
        var isSameData = (0, remeda_1.hasSubObject)(existing.data, update.data);
        var data = isSameData ? existing.data : update.data;
        if (!isSameData) {
            // Preserve hovered and dimmed states if not specified in update
            if ((0, remeda_1.isDefined)(existing.data.hovered) && !(0, remeda_1.isDefined)(update.data.hovered)) {
                data = __assign(__assign({}, data), { hovered: existing.data.hovered });
            }
            if ((0, remeda_1.isDefined)(existing.data.dimmed) && !(0, remeda_1.isDefined)(update.data.dimmed)) {
                data = __assign(__assign({}, data), { dimmed: existing.data.dimmed });
            }
        }
        var _w = (0, system_1.getNodeDimensions)(existing), existingWidth = _w.width, existingHeight = _w.height;
        var haveHandles = Object.hasOwn(existing, 'handles') || Object.hasOwn(update, 'handles');
        var isSameHandles = !haveHandles || (0, fast_equals_1.deepEqual)((_a = existing.handles) !== null && _a !== void 0 ? _a : [], (_b = update.handles) !== null && _b !== void 0 ? _b : []);
        if (isSameData
            && isSameHandles
            && (0, fast_equals_1.deepEqual)(existingWidth, (_c = update.width) !== null && _c !== void 0 ? _c : update.initialWidth)
            && (0, fast_equals_1.deepEqual)(existingHeight, (_d = update.height) !== null && _d !== void 0 ? _d : update.initialHeight)
            && (0, fast_equals_1.deepEqual)((_e = existing.parentId) !== null && _e !== void 0 ? _e : null, (_f = update.parentId) !== null && _f !== void 0 ? _f : null)
            && (0, fast_equals_1.deepEqual)(existing.hidden, (_g = update.hidden) !== null && _g !== void 0 ? _g : existing.hidden)
            && (0, fast_equals_1.deepEqual)(existing.selected, (_h = update.selected) !== null && _h !== void 0 ? _h : existing.selected)
            && (0, fast_equals_1.deepEqual)(existing.selectable, (_j = update.selectable) !== null && _j !== void 0 ? _j : existing.selectable)
            && (0, fast_equals_1.deepEqual)(existing.focusable, (_k = update.focusable) !== null && _k !== void 0 ? _k : existing.focusable)
            && (0, fast_equals_1.deepEqual)(existing.draggable, (_l = update.draggable) !== null && _l !== void 0 ? _l : existing.draggable)
            && (0, fast_equals_1.deepEqual)(existing.dragHandle, update.dragHandle)
            && (0, fast_equals_1.deepEqual)(existing.className, update.className)
            && (0, fast_equals_1.deepEqual)(existing.zIndex, (_m = update.zIndex) !== null && _m !== void 0 ? _m : existing.zIndex)
            && (0, fast_equals_1.deepEqual)(existing.position, update.position)
            && (0, fast_equals_1.deepEqual)((_o = existing.domAttributes) !== null && _o !== void 0 ? _o : EMPTY_OBJ, (_p = update.domAttributes) !== null && _p !== void 0 ? _p : EMPTY_OBJ)
            && (0, fast_equals_1.deepEqual)((_q = existing.style) !== null && _q !== void 0 ? _q : EMPTY_OBJ, (_r = update.style) !== null && _r !== void 0 ? _r : EMPTY_OBJ)) {
            return existing;
        }
        var handles = haveHandles && isSameHandles ? existing.handles : update.handles;
        return __assign(__assign(__assign(__assign(__assign(__assign({}, (0, remeda_1.pickBy)(existing, function (v, k) { return (0, remeda_1.isDefined)(v) && k !== 'parentId' && k !== 'handles'; })), ('measured' in existing && {
            measured: {
                width: (_s = update.width) !== null && _s !== void 0 ? _s : update.initialWidth,
                height: (_t = update.height) !== null && _t !== void 0 ? _t : update.initialHeight,
            },
        })), (0, remeda_1.pickBy)(update, remeda_1.isDefined)), { 
            // Force dimensions
            width: (_u = update.width) !== null && _u !== void 0 ? _u : update.initialWidth, height: (_v = update.height) !== null && _v !== void 0 ? _v : update.initialHeight }), (handles && { handles: handles })), { data: data });
    });
    return (0, fast_equals_1.shallowEqual)(current, updated) ? current : updated;
}
function updateNodes(current, update) {
    if ((0, remeda_1.isDefined)(update)) {
        return _update(current, update);
    }
    update = current;
    return function (existing) { return _update(existing, update); };
}
