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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.layoutResultToXYFlow = layoutResultToXYFlow;
var core_1 = require("@likec4/core");
var remeda_1 = require("remeda");
var const_1 = require("../../base/const");
// const nodeZIndex = (node: DiagramNode) => node.level - (node.children.length > 0 ? 1 : 0)
function layoutResultToXYFlow(layout) {
    var _a, _b, _c, _d, _e;
    var xynodes = [], xyedges = [], nodeLookup = new Map();
    var queue = core_1.Queue.from(layout.nodes.reduce(function (acc, node) {
        nodeLookup.set(node.id, node);
        if (!node.parent) {
            acc.push({ node: node, parent: null });
        }
        return acc;
    }, []));
    var nodeById = function (id) { return (0, core_1.nonNullable)(nodeLookup.get(id), "Node not found: ".concat(id)); };
    var next;
    while ((next = queue.dequeue())) {
        var node = next.node, parent_1 = next.parent;
        var isCompound = (0, remeda_1.hasAtLeast)(node.children, 1);
        if (isCompound) {
            for (var _i = 0, _f = node.children; _i < _f.length; _i++) {
                var child = _f[_i];
                queue.enqueue({ node: nodeById(child), parent: node });
            }
        }
        var position = {
            x: node.x,
            y: node.y,
        };
        if (parent_1) {
            position.x -= parent_1.x;
            position.y -= parent_1.y;
        }
        var id = node.id;
        var base = __assign({ id: id, draggable: false, deletable: false, position: position, zIndex: isCompound ? const_1.ZIndexes.Compound : const_1.ZIndexes.Element, style: {
                width: node.width,
                height: node.height,
            }, initialWidth: node.width, initialHeight: node.height }, (parent_1 && {
            parentId: parent_1.id,
        }));
        var fqn = node.modelRef;
        var navigateTo = { navigateTo: (_a = node.navigateTo) !== null && _a !== void 0 ? _a : null };
        switch (true) {
            case isCompound: {
                xynodes.push(__assign(__assign({}, base), { type: 'compound', data: __assign({ id: id, column: node.column, title: node.title, color: node.color, style: node.style, depth: (_b = node.depth) !== null && _b !== void 0 ? _b : 0, icon: (_c = node.icon) !== null && _c !== void 0 ? _c : 'none', ports: node.ports, fqn: fqn }, navigateTo) }));
                break;
            }
            default: {
                xynodes.push(__assign(__assign({}, base), { type: 'element', data: __assign({ id: id, column: node.column, fqn: fqn, title: node.title, technology: node.technology, description: (_d = node.description) !== null && _d !== void 0 ? _d : null, height: node.height, width: node.width, color: node.color, shape: node.shape, icon: (_e = node.icon) !== null && _e !== void 0 ? _e : 'none', ports: node.ports, style: node.style, tags: node.tags }, navigateTo) }));
            }
        }
    }
    for (var _g = 0, _h = layout.edges; _g < _h.length; _g++) {
        var _j = _h[_g];
        var source = _j.source, target = _j.target, relationId = _j.relationId, label = _j.label, technology = _j.technology, description = _j.description, _k = _j.navigateTo, navigateTo = _k === void 0 ? null : _k, _l = _j.color, color = _l === void 0 ? 'gray' : _l, _m = _j.line, line = _m === void 0 ? 'dashed' : _m, edge = __rest(_j, ["source", "target", "relationId", "label", "technology", "description", "navigateTo", "color", "line"]);
        var id = edge.id;
        xyedges.push({
            id: id,
            type: 'relationship',
            source: source,
            target: target,
            sourceHandle: edge.sourceHandle,
            targetHandle: edge.targetHandle,
            // selectable: selectable,
            // hidden: !visiblePredicate(edge),
            deletable: false,
            data: __assign({ relationId: relationId, label: label, color: color, navigateTo: navigateTo, line: line, description: description !== null && description !== void 0 ? description : null }, (technology && { technology: technology })),
        });
    }
    return {
        xynodes: xynodes,
        xyedges: xyedges,
        bounds: layout.bounds,
    };
}
