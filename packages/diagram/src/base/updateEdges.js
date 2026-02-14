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
exports.updateEdges = updateEdges;
var fast_equals_1 = require("fast-equals");
var remeda_1 = require("remeda");
var EMPTY_OBJ = {};
function _update(current, updated) {
    if (current === updated) {
        return current;
    }
    updated = updated.map(function (update) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        var existing = current.find(function (n) {
            return n.id === update.id &&
                n.type === update.type &&
                n.source === update.source &&
                n.target === update.target;
        });
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
            if ((0, remeda_1.isDefined)(existing.data.active) && !(0, remeda_1.isDefined)(update.data.active)) {
                data = __assign(__assign({}, data), { active: existing.data.active });
            }
        }
        if (isSameData
            && (0, fast_equals_1.deepEqual)(existing.hidden, (_a = update.hidden) !== null && _a !== void 0 ? _a : existing.hidden)
            && (0, fast_equals_1.deepEqual)(existing.selected, (_b = update.selected) !== null && _b !== void 0 ? _b : existing.selected)
            && (0, fast_equals_1.deepEqual)(existing.selectable, (_c = update.selectable) !== null && _c !== void 0 ? _c : existing.selectable)
            && (0, fast_equals_1.deepEqual)(existing.focusable, (_d = update.focusable) !== null && _d !== void 0 ? _d : existing.focusable)
            && (0, fast_equals_1.deepEqual)(existing.animated, (_e = update.animated) !== null && _e !== void 0 ? _e : existing.animated)
            && (0, fast_equals_1.deepEqual)(existing.className, update.className)
            && (0, fast_equals_1.deepEqual)(existing.zIndex, (_f = update.zIndex) !== null && _f !== void 0 ? _f : existing.zIndex)
            && (0, fast_equals_1.deepEqual)(existing.label, update.label)
            && (0, fast_equals_1.deepEqual)(existing.sourceHandle, update.sourceHandle)
            && (0, fast_equals_1.deepEqual)(existing.targetHandle, update.targetHandle)
            && (0, fast_equals_1.deepEqual)((_g = existing.style) !== null && _g !== void 0 ? _g : EMPTY_OBJ, (_h = update.style) !== null && _h !== void 0 ? _h : EMPTY_OBJ)) {
            return existing;
        }
        return __assign(__assign(__assign({}, (0, remeda_1.pickBy)(existing, remeda_1.isDefined)), (0, remeda_1.pickBy)(update, remeda_1.isDefined)), { data: data });
    });
    return (0, remeda_1.isShallowEqual)(current, updated) ? current : updated;
}
function updateEdges(current, update) {
    if ((0, remeda_1.isDefined)(update)) {
        return _update(current, update);
    }
    update = current;
    return function (current) { return _update(current, update); };
}
