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
exports.viewToNodesEdge = viewToNodesEdge;
exports.useViewToNodesEdges = useViewToNodesEdges;
var core_1 = require("@likec4/core");
var web_1 = require("@react-hookz/web");
var remeda_1 = require("remeda");
var const_1 = require("../../base/const");
var layout_1 = require("./layout");
// const nodeZIndex = (node: DiagramNode) => node.level - (node.children.length > 0 ? 1 : 0)
function viewToNodesEdge(view) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    var xynodes = [], xyedges = [], nodeLookup = new Map();
    var queue = core_1.Queue.from(view.nodes.reduce(function (acc, node) {
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
        var isCompound = (0, remeda_1.hasAtLeast)(node.children, 1) || node.kind == core_1.GroupElementKind;
        if (isCompound) {
            for (var _i = 0, _j = node.children; _i < _j.length; _i++) {
                var child = _j[_i];
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
        var base = __assign({ id: id, position: position, zIndex: isCompound ? const_1.ZIndexes.Compound : const_1.ZIndexes.Element, style: {
                width: node.width,
                height: node.height,
            }, initialWidth: node.width, initialHeight: node.height }, (parent_1 && {
            parentId: parent_1.id,
        }));
        var fqn = (_a = node.modelRef) !== null && _a !== void 0 ? _a : null;
        // const deploymentRef = DiagramNode.deploymentRef(node)
        // if (!fqn) {
        //   console.error('Invalid node', node)
        //   throw new Error('Element should have either modelRef or deploymentRef')
        // }
        var navigateTo = { navigateTo: (_b = node.navigateTo) !== null && _b !== void 0 ? _b : null };
        switch (true) {
            case node.kind === layout_1.LayoutRelationshipsViewResult.Empty: {
                xynodes.push(__assign(__assign({}, base), { type: 'empty', data: {
                        column: node.column,
                    } }));
                break;
            }
            case isCompound && !!fqn: {
                xynodes.push(__assign(__assign({}, base), { type: 'compound', data: __assign({ id: id, column: node.column, title: node.title, color: node.color, shape: node.shape, style: node.style, depth: (_c = node.depth) !== null && _c !== void 0 ? _c : 0, icon: (_d = node.icon) !== null && _d !== void 0 ? _d : 'none', ports: node.ports, existsInCurrentView: node.existsInCurrentView, fqn: fqn }, navigateTo) }));
                break;
            }
            default: {
                (0, core_1.invariant)(fqn, 'Element should have either modelRef or deploymentRef');
                xynodes.push(__assign(__assign({}, base), { type: 'element', data: __assign({ id: id, column: node.column, fqn: fqn, title: node.title, technology: node.technology, description: node.description, height: node.height, width: node.width, color: node.color, shape: node.shape, icon: (_e = node.icon) !== null && _e !== void 0 ? _e : 'none', ports: node.ports, style: node.style, existsInCurrentView: node.existsInCurrentView, tags: node.tags }, navigateTo) }));
            }
        }
    }
    for (var _k = 0, _l = view.edges; _k < _l.length; _k++) {
        var edge = _l[_k];
        var source = edge.source;
        var target = edge.target;
        var id = edge.id;
        if (!(0, remeda_1.hasAtLeast)(edge.points, 2)) {
            console.error('edge should have at least 2 points', edge);
            continue;
        }
        if (!(0, remeda_1.hasAtLeast)(edge.relations, 1)) {
            console.error('edge should have at least 1 relation', edge);
            continue;
        }
        xyedges.push({
            id: id,
            type: 'relationship',
            source: source,
            target: target,
            sourceHandle: edge.sourceHandle,
            targetHandle: edge.targetHandle,
            // selectable: selectable,
            // hidden: !visiblePredicate(edge),
            // deletable: false,
            data: {
                sourceFqn: edge.sourceFqn,
                targetFqn: edge.targetFqn,
                relations: edge.relations,
                color: (_f = edge.color) !== null && _f !== void 0 ? _f : 'gray',
                label: edge.label,
                navigateTo: (_g = edge.navigateTo) !== null && _g !== void 0 ? _g : null,
                line: (_h = edge.line) !== null && _h !== void 0 ? _h : 'dashed',
                existsInCurrentView: edge.existsInCurrentView,
            },
            interactionWidth: 20,
        });
    }
    return {
        xynodes: xynodes,
        xyedges: xyedges,
    };
}
function useViewToNodesEdges(_a) {
    var edges = _a.edges, nodes = _a.nodes;
    return (0, web_1.useDeepCompareMemo)(function () {
        return viewToNodesEdge({
            nodes: nodes,
            edges: edges,
        });
    }, [nodes, edges]);
}
