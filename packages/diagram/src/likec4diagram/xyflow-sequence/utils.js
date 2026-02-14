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
exports.findParallelRects = findParallelRects;
exports.buildCompounds = buildCompounds;
var utils_1 = require("@likec4/core/utils");
var remeda_1 = require("remeda");
/**
 * From steps find boxes that must be marked as parallel on the layout
 */
function findParallelRects(steps) {
    return (0, remeda_1.pipe)(steps, (0, remeda_1.groupBy)(function (s) { var _a; return (_a = s.parallelPrefix) !== null && _a !== void 0 ? _a : undefined; }), (0, remeda_1.mapValues)(function (steps, parallelPrefix) {
        return steps.reduce(function (acc, step) {
            acc.min.column = Math.min(acc.min.column, step.from.column, step.to.column);
            acc.min.row = Math.min(acc.min.row, step.from.row, step.to.row);
            acc.max.column = Math.max(acc.max.column, step.from.column, step.to.column);
            acc.max.row = Math.max(acc.max.row, step.from.row, step.to.row);
            return acc;
        }, {
            parallelPrefix: parallelPrefix,
            min: {
                column: Infinity,
                row: Infinity,
            },
            max: {
                column: -Infinity,
                row: -Infinity,
            },
        });
    }), (0, remeda_1.values)());
}
/**
 * Builds a tree of compounds from actors and nodes.
 * @param actors the actors in the sequence view
 * @param nodes the nodes in likec4 diagram
 * @returns an array of compounds where each compound is a node in the sequence view
 * that is an ancestor of one of the actors
 */
function buildCompounds(actors, nodes) {
    if (actors.length === 0 || actors.length === nodes.length) {
        return [];
    }
    var getNode = function (id) { return (0, utils_1.nonNullable)(nodes.find(function (n) { return n.id === id; })); };
    function parentsLookup(node) {
        var parent = node.parent ? getNode(node.parent) : null;
        if (parent) {
            return __spreadArray([parent], parentsLookup(parent), true);
        }
        return [];
    }
    var stack = new utils_1.Stack();
    var result = [];
    actors.forEach(function (actor) {
        var _a;
        var _ancestors = parentsLookup(actor);
        if (_ancestors.length === 0) {
            stack.clear();
            return;
        }
        var ancestors = utils_1.Stack.from(_ancestors);
        var compound;
        var parent;
        while (true) {
            compound = (_a = stack.peek()) === null || _a === void 0 ? void 0 : _a.node;
            parent = ancestors.peek();
            if (!parent || !compound) {
                break;
            }
            // Drop ancestors that are ancestors of the current compound
            if ((0, utils_1.isAncestor)(parent.id, compound.id) || parent.id === compound.id) {
                ancestors.pop();
                continue;
            }
            // Drop compounds that are not ancestors of the current parent
            if (!(0, utils_1.isAncestor)(compound.id, parent.id)) {
                stack.pop();
                continue;
            }
            break;
        }
        // Add ancestors to the stack
        while ((parent = ancestors.pop())) {
            var parentAsCompound = {
                node: parent,
                from: actor,
                to: actor,
                nested: [],
            };
            var compound_1 = stack.peek();
            if (!compound_1) {
                result.push(parentAsCompound);
            }
            else {
                compound_1.nested.push(parentAsCompound);
            }
            stack.push(parentAsCompound);
        }
        stack.forEach(function (c) { return c.to = actor; });
    });
    return result;
}
