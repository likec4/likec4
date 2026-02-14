"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.createLayoutConstraints = createLayoutConstraints;
exports.useLayoutConstraints = useLayoutConstraints;
var core_1 = require("@likec4/core");
var geometry_1 = require("@likec4/core/geometry");
var utils_1 = require("@likec4/core/utils");
var system_1 = require("@xyflow/system");
var immer_1 = require("immer");
var react_1 = require("react");
var remeda_1 = require("remeda");
var hooks_1 = require("../hooks");
var useDiagram_1 = require("../hooks/useDiagram");
var utils_2 = require("../utils");
var xyflow_1 = require("../utils/xyflow");
var Rect = /** @class */ (function () {
    function Rect(xynode, parent) {
        if (parent === void 0) { parent = null; }
        this.minX = Infinity;
        this.minY = Infinity;
        this.maxX = -Infinity;
        this.maxY = -Infinity;
        this.id = xynode.id;
        this.positionAbsolute = !parent ? xynode.position : {
            x: xynode.position.x + parent.minX,
            y: xynode.position.y + parent.minY,
        };
        var _a = (0, system_1.getNodeDimensions)(xynode), width = _a.width, height = _a.height;
        this.maxX = this.minX + Math.ceil(width);
        this.maxY = this.minY + Math.ceil(height);
        this.initial = {
            x: this.minX,
            y: this.minY,
            width: Math.ceil(width),
            height: Math.ceil(height),
        };
        if (parent) {
            parent.children.push(this);
        }
    }
    Object.defineProperty(Rect.prototype, "positionAbsolute", {
        get: function () {
            return {
                x: this.minX,
                y: this.minY,
            };
        },
        set: function (pos) {
            var x = Math.trunc(pos.x);
            var y = Math.trunc(pos.y);
            this.maxX += x - this.minX;
            this.maxY += y - this.minY;
            this.minX = x;
            this.minY = y;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Rect.prototype, "dimensions", {
        get: function () {
            return {
                width: Math.ceil(this.maxX - this.minX),
                height: Math.ceil(this.maxY - this.minY),
            };
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Rect.prototype, "diff", {
        get: function () {
            var _a = this.positionAbsolute, x = _a.x, y = _a.y;
            return {
                x: Math.trunc(x - this.initial.x),
                y: Math.trunc(y - this.initial.y),
            };
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Rect.prototype, "isMoved", {
        get: function () {
            var diff = this.diff;
            return diff.x !== 0 || diff.y !== 0;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Rect.prototype, "isResized", {
        get: function () {
            var dim = this.dimensions;
            return dim.width !== this.initial.width || dim.height !== this.initial.height;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Rect.prototype, "position", {
        // Position relative to parent
        get: function () {
            var positionAbsolute = this.positionAbsolute;
            if (!this.parent) {
                return positionAbsolute;
            }
            var parentPosition = this.parent.positionAbsolute;
            return {
                x: positionAbsolute.x - parentPosition.x,
                y: positionAbsolute.y - parentPosition.y,
            };
        },
        enumerable: false,
        configurable: true
    });
    Rect.LeftPadding = 42;
    Rect.RightPadding = 42;
    Rect.TopPadding = 60;
    Rect.BottomPadding = 42;
    return Rect;
}());
var CompoundRect = /** @class */ (function (_super) {
    __extends(CompoundRect, _super);
    function CompoundRect(xynode, parent) {
        if (parent === void 0) { parent = null; }
        var _this = _super.call(this, xynode, parent) || this;
        _this.parent = parent;
        _this.children = [];
        return _this;
    }
    return CompoundRect;
}(Rect));
var Leaf = /** @class */ (function (_super) {
    __extends(Leaf, _super);
    function Leaf(xynode, parent) {
        if (parent === void 0) { parent = null; }
        var _this = _super.call(this, xynode, parent) || this;
        _this.parent = parent;
        return _this;
    }
    return Leaf;
}(Rect));
/**
 * Creates a modifier function that moves edge points according to the given rectangle's diff.
 */
function makeEdgeModifier(edge, anchor) {
    var _a;
    var controlPoints = (_a = edge.data.controlPoints) !== null && _a !== void 0 ? _a : null;
    return function (edgeLookup) {
        var current = (0, core_1.nonNullable)(edgeLookup.get(edge.id), "Edge ".concat(edge.id, " not found"));
        var _a = anchor.diff, dx = _a.x, dy = _a.y;
        if (dx === 0 && dy === 0) {
            return {
                id: edge.id,
                type: 'replace',
                item: (0, immer_1.produce)(current, function (draft) {
                    draft.data.points = edge.data.points;
                    draft.data.controlPoints = controlPoints;
                    draft.data.labelBBox = edge.data.labelBBox;
                }),
            };
        }
        return {
            id: edge.id,
            type: 'replace',
            item: (0, immer_1.produce)(current, function (draft) {
                var _a;
                var _b;
                draft.data.points = (0, remeda_1.map)(edge.data.points, function (pt) { return [pt[0] + dx, pt[1] + dy]; });
                if (controlPoints) {
                    draft.data.controlPoints = controlPoints.map(function (pt) { return ({
                        x: pt.x + dx,
                        y: pt.y + dy,
                    }); });
                }
                else {
                    draft.data.controlPoints = null;
                }
                if (edge.data.labelBBox) {
                    (_a = (_b = draft.data).labelBBox) !== null && _a !== void 0 ? _a : (_b.labelBBox = edge.data.labelBBox);
                    draft.data.labelBBox.x = edge.data.labelBBox.x + dx;
                    draft.data.labelBBox.y = edge.data.labelBBox.y + dy;
                }
            }),
        };
    };
}
/**
 * Creates a modifier function that moves edge points when one of its nodes is moved.
 */
function makeRelativeEdgeModifier(edge, movingRect, anchorNode, staticNode) {
    var _a;
    var controlPoints = (_a = edge.data.controlPoints) !== null && _a !== void 0 ? _a : (0, utils_2.bezierControlPoints)(edge.data.points);
    var anchorV = (0, utils_2.vector)(geometry_1.BBox.center(anchorNode));
    var staticV = (0, utils_2.vector)(geometry_1.BBox.center(staticNode));
    var staticToAnchor = anchorV.subtract(staticV);
    var staticToAnchorLength = staticToAnchor.length();
    return function (edgeLookup) {
        var current = (0, core_1.nonNullable)(edgeLookup.get(edge.id), "Edge ".concat(edge.id, " not found"));
        var _a = movingRect.diff, dx = _a.x, dy = _a.y;
        if (dx === 0 && dy === 0) {
            return {
                id: edge.id,
                type: 'replace',
                item: (0, immer_1.produce)(current, function (draft) {
                    draft.data.points = edge.data.points;
                    draft.data.controlPoints = edge.data.controlPoints;
                    draft.data.labelBBox = edge.data.labelBBox;
                }),
            };
        }
        var d = (0, utils_2.vector)(dx, dy);
        var relativePoint = function (pt) {
            var point = (0, utils_2.vector)(pt);
            var staticToP = point.subtract(staticV);
            var projLength = staticToP.dot(staticToAnchor);
            // relative coefficient of the point between static and anchor
            // clamp to (-1,1) to avoid invalid positions when control point goes beyond anchor
            var coeff = (0, remeda_1.clamp)(projLength / (Math.pow(staticToAnchorLength, 2)), {
                min: -1,
                max: 1,
            });
            var newPoint = point
                .add(d.multiply(coeff))
                .trunc();
            return {
                x: newPoint.x,
                y: newPoint.y,
            };
        };
        return {
            id: edge.id,
            type: 'replace',
            item: (0, immer_1.produce)(current, function (draft) {
                var _a;
                var _b;
                draft.data.controlPoints = controlPoints.map(relativePoint);
                if (edge.data.labelBBox) {
                    (_a = (_b = draft.data).labelBBox) !== null && _a !== void 0 ? _a : (_b.labelBBox = edge.data.labelBBox);
                    var _c = relativePoint(edge.data.labelBBox), x = _c.x, y = _c.y;
                    draft.data.labelBBox.x = x;
                    draft.data.labelBBox.y = y;
                }
            }),
        };
    };
}
function createLayoutConstraints(xyflowApi, editingNodeIds) {
    var _a, _b, _c, _d;
    var _e = xyflowApi.getState(), parentLookup = _e.parentLookup, nodeLookup = _e.nodeLookup, edges = _e.edges;
    var rects = new Map();
    /** Maps node id to all its ancestors */
    var ancestorsOf = new core_1.DefaultMap(function (nodeId) {
        var xynode = nodeLookup.get(nodeId);
        var parent = xynode === null || xynode === void 0 ? void 0 : xynode.parentId;
        if (!parent) {
            return [];
        }
        return __spreadArray([parent], ancestorsOf.get(parent), true);
    });
    /** Maps node id to all its nested descendants */
    var nestedOf = new core_1.DefaultMap(function (nodeId) {
        var children = parentLookup.get(nodeId);
        if (!children || children.size === 0) {
            return new Set();
        }
        var nested = new Set();
        for (var _i = 0, _a = children.values(); _i < _a.length; _i++) {
            var child = _a[_i];
            nested.add(child.id);
            for (var _b = 0, _c = nestedOf.get(child.id); _b < _c.length; _b++) {
                var desc = _c[_b];
                nested.add(desc);
            }
        }
        return nested;
    });
    // If multiple nodes are being edited, ensure they are not nested within each other
    if ((0, remeda_1.hasAtLeast)(editingNodeIds, 2)) {
        var leafsOnly = (0, remeda_1.pipe)(editingNodeIds, (0, remeda_1.flatMap)(function (id) { return __spreadArray([], nestedOf.get(id), true); }), (0, remeda_1.unique)(), function (exclude) { return (0, remeda_1.difference)(editingNodeIds, exclude); });
        (0, utils_1.invariant)((0, remeda_1.hasAtLeast)(leafsOnly, 1), 'All editing nodes are nested within each other');
        editingNodeIds = leafsOnly;
    }
    var ancestorsOfDraggingNodes = new Set(editingNodeIds.flatMap(function (i) { return ancestorsOf.get(i); }));
    // Build Rects tree, starting from root nodes
    var traverse = __spreadArray([], nodeLookup.values(), true).flatMap(function (x) {
        return !x.parentId ? { xynode: x, parent: null } : [];
    });
    var _loop_1 = function () {
        var _h = traverse.shift(), xynode = _h.xynode, parent_1 = _h.parent;
        var isEditing = editingNodeIds.includes(xynode.id);
        // Traverse children if the node is a compound, not dragging, and is an ancestor of the dragging node
        var shouldTraverse = !isEditing && ancestorsOfDraggingNodes.has(xynode.id);
        if (shouldTraverse) {
            var rect_1 = new CompoundRect(xynode, parent_1);
            rects.set(xynode.id, rect_1);
            (_a = parentLookup.get(xynode.id)) === null || _a === void 0 ? void 0 : _a.forEach(function (child) {
                traverse.push({
                    xynode: child,
                    parent: rect_1,
                });
            });
            return "continue";
        }
        rects.set(xynode.id, new Leaf(xynode, parent_1));
    };
    while (traverse.length > 0) {
        _loop_1();
    }
    var rectsToUpdate = __spreadArray([], rects.values(), true);
    /**
     * Edges that need to be updated because both source and target are moved
     * - source and target are inside a compound node that is moved
     * - source and target are selected and moved
     */
    var edgeModifiers = new Map();
    var findMovingAncestor = function (nodeId) {
        var r = rects.get(nodeId);
        if (r) {
            return r;
        }
        for (var _i = 0, _a = ancestorsOf.get(nodeId); _i < _a.length; _i++) {
            var parent_2 = _a[_i];
            var rect = rects.get(parent_2);
            if (rect) {
                return rect;
            }
        }
        return null;
    };
    // moving nodes may have nested nodes as well
    var movingNodes = new Set(editingNodeIds.flatMap(function (id) { return __spreadArray([id], nestedOf.get(id), true); }));
    for (var _i = 0, edges_1 = edges; _i < edges_1.length; _i++) {
        var edge = edges_1[_i];
        var isSourceMoving = movingNodes.has(edge.source);
        var isTargetMoving = movingNodes.has(edge.target);
        if (!isSourceMoving && !isTargetMoving) {
            continue;
        }
        // We update edges, where both source and target are moving nodes
        if (isSourceMoving && isTargetMoving) {
            // Find the anchor rectangle for the edge
            var r = (_d = (_c = (_b = rects.get(edge.source)) !== null && _b !== void 0 ? _b : rects.get(edge.target)) !== null && _c !== void 0 ? _c : findMovingAncestor(edge.source)) !== null && _d !== void 0 ? _d : findMovingAncestor(edge.target);
            (0, utils_1.invariant)(!!r, 'At least one of the edge nodes should have a moving ancestor');
            edgeModifiers.set(edge, makeEdgeModifier(edge, r));
            continue;
        }
        // When source OR target is moved, move control points and label position relatively
        (0, utils_1.invariant)(isSourceMoving !== isTargetMoving, 'Logic error');
        var movingRect = isSourceMoving ? findMovingAncestor(edge.source) : findMovingAncestor(edge.target);
        (0, utils_1.invariant)(!!movingRect, 'Moving endpoint should be found');
        var _f = (0, remeda_1.pipe)([edge.source, edge.target], (0, remeda_1.map)(function (id) { return (0, core_1.nonNullable)(nodeLookup.get(id), "Node ".concat(id, " not found")); }), (0, remeda_1.map)(xyflow_1.nodeToRect)), sourceNode = _f[0], targetNode = _f[1];
        // Determine anchor (moving point) and static point
        var _g = isSourceMoving
            ? [sourceNode, targetNode]
            : [targetNode, sourceNode], anchorNode = _g[0], staticNode = _g[1];
        edgeModifiers.set(edge, makeRelativeEdgeModifier(edge, movingRect, anchorNode, staticNode));
    }
    function applyConstraints(targets) {
        for (var _i = 0, targets_1 = targets; _i < targets_1.length; _i++) {
            var r = targets_1[_i];
            if (!(r instanceof CompoundRect)) {
                continue;
            }
            applyConstraints(r.children);
            var childrenBB = {
                minX: Infinity,
                minY: Infinity,
                maxX: -Infinity,
                maxY: -Infinity,
            };
            for (var _a = 0, _b = r.children; _a < _b.length; _a++) {
                var child = _b[_a];
                childrenBB.minX = Math.min(childrenBB.minX, child.minX);
                childrenBB.minY = Math.min(childrenBB.minY, child.minY);
                childrenBB.maxX = Math.max(childrenBB.maxX, child.maxX);
                childrenBB.maxY = Math.max(childrenBB.maxY, child.maxY);
            }
            r.minX = childrenBB.minX - Rect.LeftPadding;
            r.minY = childrenBB.minY - Rect.TopPadding;
            r.maxX = childrenBB.maxX + Rect.RightPadding;
            r.maxY = childrenBB.maxY + Rect.BottomPadding;
        }
    }
    var _edgeModifiers = __spreadArray([], edgeModifiers.values(), true);
    function updateXYFlow() {
        var _a = xyflowApi.getState(), edgeLookup = _a.edgeLookup, triggerNodeChanges = _a.triggerNodeChanges, triggerEdgeChanges = _a.triggerEdgeChanges, nodeLookup = _a.nodeLookup;
        for (var _i = 0, editingNodeIds_1 = editingNodeIds; _i < editingNodeIds_1.length; _i++) {
            var id = editingNodeIds_1[_i];
            var rect = rects.get(id);
            if (!rect) {
                console.warn("Rect not found for id ".concat(id));
                continue;
            }
            var node = nodeLookup.get(id);
            if (!node) {
                console.warn("Node not found for id ".concat(id));
                continue;
            }
            rect.positionAbsolute = node.internals.positionAbsolute;
        }
        applyConstraints(rectsToUpdate);
        var nodeUpdates = [];
        var edgeUpdates = [];
        for (var _b = 0, rectsToUpdate_1 = rectsToUpdate; _b < rectsToUpdate_1.length; _b++) {
            var r = rectsToUpdate_1[_b];
            nodeUpdates.push({
                id: r.id,
                type: 'position',
                dragging: false,
                position: r.position,
                positionAbsolute: r.positionAbsolute,
            });
            if (r instanceof CompoundRect) {
                nodeUpdates.push({
                    id: r.id,
                    type: 'dimensions',
                    setAttributes: true,
                    resizing: false,
                    dimensions: r.dimensions,
                });
            }
        }
        if (nodeUpdates.length > 0) {
            triggerNodeChanges(nodeUpdates);
        }
        for (var _c = 0, _edgeModifiers_1 = _edgeModifiers; _c < _edgeModifiers_1.length; _c++) {
            var fm = _edgeModifiers_1[_c];
            edgeUpdates.push(fm(edgeLookup));
        }
        if (edgeUpdates.length > 0) {
            triggerEdgeChanges(edgeUpdates);
        }
    }
    var animationFrameId = null;
    function cancelPending() {
        if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    }
    function flushPending() {
        cancelPending();
        updateXYFlow();
    }
    function onMove() {
        // if (rectsToUpdate.length === 0) {
        //   return
        // }
        // cancelPending()
        animationFrameId !== null && animationFrameId !== void 0 ? animationFrameId : (animationFrameId = requestAnimationFrame(function () {
            animationFrameId = null;
            updateXYFlow();
        }));
    }
    function hasChanges() {
        return (0, utils_1.isome)(rectsToUpdate, function (r) { return r.isMoved || r.isResized; });
    }
    return {
        rects: rects,
        onMove: onMove,
        updateXYFlow: updateXYFlow,
        hasChanges: hasChanges,
        cancelPending: cancelPending,
        flushPending: flushPending,
    };
}
/**
 * Keeps the layout constraints (parent nodes and children) when dragging a node
 */
function useLayoutConstraints() {
    var xystore = (0, hooks_1.useXYStoreApi)();
    var diagram = (0, useDiagram_1.useDiagram)();
    var solverRef = (0, react_1.useRef)(undefined);
    return (0, react_1.useMemo)(function () {
        return ({
            onNodeDragStart: function (_event, xynode) {
                var nodeLookup = xystore.getState().nodeLookup;
                var draggingNodes = (0, remeda_1.pipe)(Array.from(nodeLookup.values()), (0, remeda_1.filter)(function (n) { return (n.dragging === true || n.id === xynode.id || n.selected === true); }), (0, remeda_1.map)(function (n) { return n.id; }));
                if ((0, remeda_1.hasAtLeast)(draggingNodes, 1)) {
                    diagram.startEditing('node');
                    solverRef.current = createLayoutConstraints(xystore, draggingNodes);
                }
            },
            onNodeDrag: function (_event) {
                var _a;
                (_a = solverRef.current) === null || _a === void 0 ? void 0 : _a.onMove();
            },
            onNodeDragStop: function (_event) {
                if (!solverRef.current) {
                    return;
                }
                var hasChanges = solverRef.current.hasChanges();
                if (hasChanges) {
                    solverRef.current.flushPending();
                }
                else {
                    solverRef.current.cancelPending();
                }
                diagram.stopEditing(hasChanges);
                solverRef.current = undefined;
            },
        });
    }, [xystore, diagram]);
}
