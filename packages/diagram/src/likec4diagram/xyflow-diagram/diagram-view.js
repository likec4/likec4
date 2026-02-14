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
exports.diagramToXY = diagramToXY;
var core_1 = require("@likec4/core");
var remeda_1 = require("remeda");
var const_1 = require("../../base/const");
/**
 * Convert a diagram view to XY flow nodes and edges.
 * @param opts
 * @param opts.view - The diagram view to convert.
 * @param opts.currentViewId - The ID of the current view.
 * @param opts.where - Optional filter for nodes and edges.
 * @returns An object containing an array of XY flow nodes and an array of XY flow edges.
 */
function diagramToXY(opts) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z;
    var view = opts.view;
    var xynodes = [], xyedges = [], nodeLookup = new Map();
    var viewLayoutDir = (_b = (_a = view.autoLayout) === null || _a === void 0 ? void 0 : _a.direction) !== null && _b !== void 0 ? _b : 'TB';
    var queue = core_1.Queue.from(view.nodes.reduce(function (acc, node) {
        nodeLookup.set(node.id, node);
        if (!node.parent) {
            acc.push({ node: node, parent: null });
        }
        return acc;
    }, []));
    var visiblePredicate = function (_nodeOrEdge) { return true; };
    if (opts.where) {
        try {
            var filterablePredicate_1 = (0, core_1.whereOperatorAsPredicate)(opts.where);
            visiblePredicate = function (i) {
                return filterablePredicate_1(__assign(__assign(__assign({}, (0, remeda_1.pick)(i, ['tags', 'kind'])), ('source' in i ? { source: nodeById(i.source) } : i)), ('target' in i ? { target: nodeById(i.target) } : i)));
            };
        }
        catch (e) {
            console.error('Error in where filter:', e);
        }
    }
    // const visiblePredicate = opts.where ? whereOperatorAsPredicate(opts.where) : () => true
    // namespace to force unique ids
    var ns = '';
    var nodeById = function (id) { return (0, core_1.nonNullable)(nodeLookup.get(id), "Node not found: ".concat(id)); };
    var next;
    while ((next = queue.dequeue())) {
        var node = next.node, parent_1 = next.parent;
        var isCompound = (0, remeda_1.hasAtLeast)(node.children, 1) || node.kind == core_1.GroupElementKind;
        if (isCompound) {
            for (var _i = 0, _0 = node.children; _i < _0.length; _i++) {
                var child = _0[_i];
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
        var id = ns + node.id;
        var base = __assign({ id: id, deletable: false, position: position, zIndex: isCompound ? const_1.ZIndexes.Compound : const_1.ZIndexes.Element, style: {
                width: node.width,
                height: node.height,
            }, initialWidth: node.width, initialHeight: node.height, hidden: node.kind !== core_1.GroupElementKind && !visiblePredicate(node) }, (parent_1 && {
            parentId: ns + parent_1.id,
        }));
        var compoundData = {
            viewId: view.id,
            id: node.id,
            title: node.title,
            color: node.color,
            shape: node.shape,
            style: node.style,
            depth: (_c = node.depth) !== null && _c !== void 0 ? _c : 0,
            icon: (_d = node.icon) !== null && _d !== void 0 ? _d : 'none',
            tags: (_e = node.tags) !== null && _e !== void 0 ? _e : null,
            x: node.x,
            y: node.y,
            drifts: (_f = node.drifts) !== null && _f !== void 0 ? _f : null,
            notes: node.notes,
            viewLayoutDir: viewLayoutDir,
        };
        var leafNodeData = {
            viewId: view.id,
            id: node.id,
            title: node.title,
            technology: (_g = node.technology) !== null && _g !== void 0 ? _g : null,
            description: (_h = node.description) !== null && _h !== void 0 ? _h : null,
            height: node.height,
            width: node.width,
            level: node.level,
            color: node.color,
            shape: node.shape,
            style: node.style,
            icon: (_j = node.icon) !== null && _j !== void 0 ? _j : null,
            tags: node.tags,
            notes: node.notes,
            x: node.x,
            y: node.y,
            isMultiple: (_l = (_k = node.style) === null || _k === void 0 ? void 0 : _k.multiple) !== null && _l !== void 0 ? _l : false,
            drifts: (_m = node.drifts) !== null && _m !== void 0 ? _m : null,
            viewLayoutDir: viewLayoutDir,
        };
        if (node.kind === core_1.GroupElementKind) {
            xynodes.push(__assign(__assign({}, base), { type: 'view-group', data: __assign({ isViewGroup: true }, compoundData), dragHandle: '.likec4-compound-title-container' }));
            continue;
        }
        var modelFqn = (_o = node.modelRef) !== null && _o !== void 0 ? _o : null;
        var deploymentFqn = (_p = node.deploymentRef) !== null && _p !== void 0 ? _p : null;
        if (!modelFqn && !deploymentFqn) {
            console.error('Invalid node', node);
            throw new Error('Element should have either modelRef or deploymentRef');
        }
        var navigateTo = { navigateTo: (_q = node.navigateTo) !== null && _q !== void 0 ? _q : null };
        switch (true) {
            case isCompound && !!deploymentFqn: {
                xynodes.push(__assign(__assign({}, base), { type: 'compound-deployment', data: __assign(__assign(__assign({}, compoundData), navigateTo), { deploymentFqn: deploymentFqn, modelFqn: modelFqn }) }));
                break;
            }
            case isCompound: {
                (0, core_1.invariant)(!!modelFqn, 'ModelRef expected');
                xynodes.push(__assign(__assign({}, base), { type: 'compound-element', data: __assign(__assign(__assign({}, compoundData), navigateTo), { modelFqn: modelFqn }) }));
                break;
            }
            case !!deploymentFqn: {
                xynodes.push(__assign(__assign({}, base), { type: 'deployment', data: __assign(__assign(__assign({}, leafNodeData), navigateTo), { deploymentFqn: deploymentFqn, modelFqn: modelFqn }) }));
                break;
            }
            default: {
                (0, core_1.invariant)(!!modelFqn, 'ModelRef expected');
                xynodes.push(__assign(__assign({}, base), { type: 'element', data: __assign(__assign(__assign({}, leafNodeData), navigateTo), { modelFqn: modelFqn }) }));
            }
        }
    }
    for (var _1 = 0, _2 = view.edges; _1 < _2.length; _1++) {
        var edge = _2[_1];
        var source = edge.source;
        var target = edge.target;
        var id = ns + edge.id;
        if (!(0, remeda_1.hasAtLeast)(edge.points, 2)) {
            console.error('edge should have at least 2 points', edge);
            continue;
        }
        xyedges.push({
            id: id,
            type: 'relationship',
            source: ns + source,
            target: ns + target,
            zIndex: const_1.ZIndexes.Edge,
            hidden: !visiblePredicate(edge),
            deletable: false,
            data: {
                id: edge.id,
                label: edge.label,
                technology: edge.technology,
                notes: (_r = edge.notes) !== null && _r !== void 0 ? _r : null,
                navigateTo: edge.navigateTo,
                controlPoints: (_s = edge.controlPoints) !== null && _s !== void 0 ? _s : null,
                labelBBox: (_t = edge.labelBBox) !== null && _t !== void 0 ? _t : null,
                labelXY: null,
                points: edge.points,
                color: (_u = edge.color) !== null && _u !== void 0 ? _u : 'gray',
                line: (_v = edge.line) !== null && _v !== void 0 ? _v : 'dashed',
                dir: (_w = edge.dir) !== null && _w !== void 0 ? _w : 'forward',
                head: (_x = edge.head) !== null && _x !== void 0 ? _x : 'normal',
                tail: (_y = edge.tail) !== null && _y !== void 0 ? _y : 'none',
                astPath: edge.astPath,
                drifts: (_z = edge.drifts) !== null && _z !== void 0 ? _z : null,
            },
            interactionWidth: 20,
        });
    }
    return {
        xynodes: xynodes,
        xyedges: xyedges,
    };
}
