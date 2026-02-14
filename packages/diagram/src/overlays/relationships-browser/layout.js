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
exports.LayoutRelationshipsViewResult = void 0;
exports.layoutRelationshipsView = layoutRelationshipsView;
exports.useRelationshipsView = useRelationshipsView;
var compute_view_1 = require("@likec4/core/compute-view");
var react_1 = require("react");
var dagre_1 = require("@dagrejs/dagre");
var types_1 = require("@likec4/core/types");
var utils_1 = require("@likec4/core/utils");
var remeda_1 = require("remeda");
var useLikeC4Model_1 = require("../../hooks/useLikeC4Model");
/**
 * All constants related to the layout
 */
var Sizes = {
    dagre: {
        ranksep: 60,
        nodesep: 35,
        edgesep: 25,
    },
    edgeLabel: {
        width: 140,
        height: 10,
        minlen: 1,
        weight: 1,
    },
    emptyNodeOffset: 120,
    nodeWidth: 330,
    nodeHeight: 180,
    // Spacer between elements in a compound node
    // 0 means no spacer
    spacerHeight: 0,
    compound: {
        labelHeight: 2,
        paddingTop: 50,
        paddingBottom: 32,
    },
};
function createGraph() {
    var g = new dagre_1.default.graphlib.Graph({
        directed: true,
        compound: true,
        multigraph: true,
    });
    g.setGraph(__assign(__assign({}, Sizes.dagre), { rankdir: 'LR' }));
    g.setDefaultEdgeLabel(function () { return (__assign({}, Sizes.edgeLabel)); });
    g.setDefaultNodeLabel(function () { return ({}); });
    return g;
}
var PortSuffix = '-port';
function createNodes(column, elements, g) {
    var graphNodes = new utils_1.DefaultMap(function (key) { return ({
        id: "".concat(column, "-").concat(key),
        portId: "".concat(column, "-").concat(key),
    }); });
    var tree = (0, compute_view_1.treeFromElements)(elements);
    for (var _i = 0, _a = tree.sorted; _i < _a.length; _i++) {
        var element = _a[_i];
        var isCompound = tree.children(element).length > 0;
        var fqn = element.id;
        var id = "".concat(column, "-").concat(fqn);
        var portId = isCompound ? "".concat(id).concat(PortSuffix) : id;
        graphNodes.set(fqn, {
            id: id,
            portId: portId,
        });
        g.setNode(id, {
            column: column,
            element: element,
            isCompound: isCompound,
            portId: portId,
            inPorts: [],
            outPorts: [],
            width: Sizes.nodeWidth,
            height: Sizes.nodeHeight,
        });
        if (isCompound) {
            g.setNode(portId, {
                element: element,
                portId: portId,
                isCompound: isCompound,
                inPorts: [],
                outPorts: [],
                width: Sizes.nodeWidth - Sizes.dagre.ranksep,
                height: Sizes.compound.labelHeight,
            });
            g.setParent(portId, id);
            // g.node(id).padding = 60
        }
        var parent_1 = tree.parent(element);
        if (parent_1) {
            g.setParent(id, "".concat(column, "-").concat(parent_1.id));
        }
    }
    return __assign(__assign({}, tree), { byId: function (id) {
            var element = tree.byId(id);
            var graph = graphNodes.get(element.id);
            return {
                element: element,
                graph: graph,
            };
        }, graphNodes: graphNodes });
}
/**
 * Apply dagre layout to the graph
 * And return a function to get node bounds for xyflow
 */
function applyDagreLayout(g) {
    dagre_1.default.layout(g, {
    // disableOptimalOrderHeuristic: true,
    });
    return function (nodeId) {
        var node = g.node(nodeId);
        var x = node.x, y = node.y, width = node.width, height = node.height;
        return {
            position: {
                x: x - Math.round(width / 2),
                y: y - Math.round(height / 2),
            },
            width: width,
            height: height,
        };
    };
}
var LayoutRelationshipsViewResult;
(function (LayoutRelationshipsViewResult) {
    LayoutRelationshipsViewResult.Empty = '@empty';
})(LayoutRelationshipsViewResult || (exports.LayoutRelationshipsViewResult = LayoutRelationshipsViewResult = {}));
function layoutRelationshipsView(data, scope) {
    var _a, _b, _c, _d, _e, _f;
    var g = createGraph();
    var incomers = createNodes('incomers', data.incomers, g), subjects = createNodes('subjects', data.subjects, g), outgoers = createNodes('outgoers', data.outgoers, g);
    var edges = [];
    (0, remeda_1.pipe)((0, remeda_1.concat)((0, remeda_1.pipe)((0, utils_1.toArray)(data.incoming), (0, remeda_1.map)(function (r) { return ({
        id: r.source.id,
        sourceFqn: r.source.id,
        targetFqn: r.target.id,
        source: incomers.byId(r.source.id).graph,
        target: subjects.byId(r.target.id).graph,
        relation: r,
    }); })), (0, remeda_1.pipe)((0, utils_1.toArray)(data.outgoing), (0, remeda_1.map)(function (r) { return ({
        id: r.target.id,
        sourceFqn: r.source.id,
        targetFqn: r.target.id,
        source: subjects.byId(r.source.id).graph,
        target: outgoers.byId(r.target.id).graph,
        relation: r,
    }); }))), (0, remeda_1.map)(function (r) { return (__assign(__assign({}, r), { expr: "".concat(r.source.id, "->").concat(r.target.id) })); }), 
    // Group if same source and target
    (0, remeda_1.groupBy)((0, remeda_1.prop)('expr')), (0, remeda_1.forEachObj)(function (grouped) {
        var source = grouped[0].source;
        var target = grouped[0].target;
        var name = grouped[0].expr;
        g.node(source.id).outPorts.push(target.id);
        g.node(target.id).inPorts.push(source.id);
        g.setEdge(source.portId, target.portId, __assign({}, Sizes.edgeLabel), name);
        edges.push({
            name: name,
            sourceFqn: grouped[0].sourceFqn,
            targetFqn: grouped[0].targetFqn,
            source: source.id,
            sourceHandle: source.id + '_out' + (g.node(source.id).outPorts.length - 1),
            target: target.id,
            targetHandle: target.id + '_in' + (g.node(target.id).inPorts.length - 1),
            relations: (0, remeda_1.map)(grouped, (0, remeda_1.prop)('relation')),
        });
    }));
    // Grow nodes with more than 2 ports
    for (var _i = 0, _g = subjects.graphNodes.values(); _i < _g.length; _i++) {
        var subjectNode = _g[_i];
        var nodeId = subjectNode.id;
        var node = g.node(nodeId);
        if (node.isCompound) {
            continue;
        }
        var edgeCount_1 = Math.max((_b = (_a = g.inEdges(nodeId)) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0, (_d = (_c = g.outEdges(nodeId)) === null || _c === void 0 ? void 0 : _c.length) !== null && _d !== void 0 ? _d : 0);
        if (edgeCount_1 > 2) {
            node.height = node.height + (edgeCount_1 - 3) * 14;
        }
    }
    var nodeIds = __spreadArray(__spreadArray(__spreadArray([], incomers.graphNodes.values(), true), subjects.graphNodes.values(), true), outgoers.graphNodes.values(), true);
    if (incomers.graphNodes.size == 0) {
        var id = 'incomers-empty';
        g.setNode(id, {
            column: 'incomers',
            element: null,
            isCompound: false,
            portId: id,
            inPorts: [],
            outPorts: [],
            width: Sizes.nodeWidth,
            height: Sizes.nodeHeight,
        });
        for (var _h = 0, _j = subjects.graphNodes.values(); _h < _j.length; _h++) {
            var subjectNode = _j[_h];
            g.setEdge(id, subjectNode.portId);
        }
        nodeIds.push({
            id: id,
            portId: id,
        });
    }
    if (outgoers.graphNodes.size == 0) {
        var id = 'outgoers-empty';
        g.setNode(id, {
            column: 'outgoers',
            element: null,
            isCompound: false,
            portId: id,
            inPorts: [],
            outPorts: [],
            width: Sizes.nodeWidth,
            height: Sizes.nodeHeight,
        });
        for (var _k = 0, _l = subjects.graphNodes.values(); _k < _l.length; _k++) {
            var subjectNode = _l[_k];
            g.setEdge(subjectNode.portId, id);
        }
        nodeIds.push({
            id: id,
            portId: id,
        });
    }
    var edgeCount = g.edgeCount();
    if (edgeCount > 10) {
        for (var _m = 0, _o = g.edges(); _m < _o.length; _m++) {
            var edge = _o[_m];
            g.setEdge(edge, __assign(__assign({}, Sizes.edgeLabel), { width: edgeCount > 25 ? 800 : 400 }));
        }
    }
    var dagreBounds = applyDagreLayout(g);
    // Calculate bounds for all nodes except compounds
    // We shrink compounds to fit their children
    var _calculatedNodeBounds = (0, remeda_1.pipe)(nodeIds, 
    // Compound nodes have different portId
    (0, remeda_1.filter)(function (n) { return n.id === n.portId; }), (0, remeda_1.mapToObj)(function (n) { return [n.id, dagreBounds(n.id)]; }));
    function nodeBounds(nodeId) {
        var _a, _b;
        return (_a = _calculatedNodeBounds[nodeId]) !== null && _a !== void 0 ? _a : (_calculatedNodeBounds[nodeId] = (0, remeda_1.pipe)((_b = g.children(nodeId)) !== null && _b !== void 0 ? _b : [], (0, remeda_1.filter)(function (id) { return !id.endsWith(PortSuffix); }), (0, remeda_1.map)(function (id) { return nodeBounds(id); }), (0, remeda_1.tap)(function (bounds) {
            (0, utils_1.invariant)(bounds.length > 0, "Node ".concat(nodeId, " has no nested nodes"));
        }), (0, remeda_1.reduce)(function (acc, bounds) {
            return {
                minY: Math.min(acc.minY, bounds.position.y),
                maxY: Math.max(acc.maxY, bounds.position.y + bounds.height),
            };
        }, { minY: Infinity, maxY: -Infinity }), function (_a) {
            var minY = _a.minY, maxY = _a.maxY;
            var _b = dagreBounds(nodeId), x = _b.position.x, width = _b.width;
            minY = minY - Sizes.compound.paddingTop;
            maxY = maxY + Sizes.compound.paddingBottom;
            return {
                position: {
                    x: x,
                    y: minY,
                },
                width: width,
                height: maxY - minY,
            };
        }));
    }
    function nodeLevel(nodeId) {
        var parent = g.parent(nodeId);
        if (parent) {
            return nodeLevel(parent) + 1;
        }
        return 0;
    }
    function nodeDepth(nodeId) {
        var _a;
        var children = (_a = g.children(nodeId)) !== null && _a !== void 0 ? _a : [];
        if (children.length === 0) {
            return 0;
        }
        return 1 + Math.max.apply(Math, children.map(nodeDepth));
    }
    // Sort ports in subject vertically
    var sortedPorts = function (nodeId, type, ports) {
        return (0, remeda_1.pipe)(ports, (0, remeda_1.map)(function (port, index) {
            return {
                port: nodeId + '_' + type + index,
                topY: nodeBounds(port).position.y,
            };
        }), (0, remeda_1.sortBy)((0, remeda_1.prop)('topY')), (0, remeda_1.map)((0, remeda_1.prop)('port')));
    };
    // In case we got negative positions
    var minX = 0;
    var minY = 0;
    var subject = __spreadArray([], subjects.root, true)[0];
    (0, utils_1.invariant)(subject, 'Subjects should not be empty');
    var subjectBounds = nodeBounds(subjects.graphNodes.get(subject.id).id);
    var nodes = nodeIds.map(function (_a) {
        var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        var id = _a.id;
        var _o = g.node(id), element = _o.element, inPorts = _o.inPorts, outPorts = _o.outPorts, column = _o.column;
        var _p = nodeBounds(id), position = _p.position, width = _p.width, height = _p.height;
        if (!element) {
            height = Math.min(subjectBounds.height, 300);
            position.y = subjectBounds.position.y + subjectBounds.height / 2 - height / 2;
            if (column === 'incomers') {
                width = subjectBounds.position.x - Sizes.emptyNodeOffset - position.x;
            }
            else {
                var rightX = position.x + width;
                position.x = subjectBounds.position.x + subjectBounds.width + Sizes.emptyNodeOffset;
                width = rightX - position.x;
            }
            return {
                id: id,
                parent: null,
                x: position.x,
                y: position.y,
                title: 'empty node',
                description: null,
                technology: null,
                tags: [],
                links: [],
                color: 'muted',
                shape: 'rectangle',
                style: {
                    border: 'dashed',
                    opacity: 50,
                },
                kind: LayoutRelationshipsViewResult.Empty,
                level: 0,
                labelBBox: {
                    x: position.x,
                    y: position.y,
                    width: width,
                    height: height,
                },
                children: [],
                width: width,
                height: height,
                column: column,
                ports: {
                    in: [],
                    out: [],
                },
                existsInCurrentView: false,
            };
        }
        var parentId = g.parent(id);
        var children = ((_b = g.children(id)) !== null && _b !== void 0 ? _b : []).filter(function (c) { return !c.endsWith(PortSuffix); });
        minX = Math.min(minX, position.x);
        minY = Math.min(minY, position.y);
        var navigateTo = scope ? (_d = (_c = (0, utils_1.ifind)(element.scopedViews(), function (v) { return v.id !== scope.id; })) === null || _c === void 0 ? void 0 : _c.id) !== null && _d !== void 0 ? _d : null : null;
        var inheritFromNode = scope === null || scope === void 0 ? void 0 : scope.findNodeWithElement(element.id);
        var scopedAncestor = scope && !inheritFromNode
            ? (_e = (0, utils_1.ifind)(element.ancestors(), function (a) { return !!scope.findNodeWithElement(a.id); })) === null || _e === void 0 ? void 0 : _e.id
            : null;
        var inheritFromNodeOrAncestor = inheritFromNode !== null && inheritFromNode !== void 0 ? inheritFromNode : (scopedAncestor && (scope === null || scope === void 0 ? void 0 : scope.findNodeWithElement(scopedAncestor)));
        return __assign(__assign({ id: id, parent: (_f = parentId) !== null && _f !== void 0 ? _f : null, x: position.x, y: position.y, title: element.title, description: (_g = (0, types_1.preferSummary)(element.$element)) !== null && _g !== void 0 ? _g : null, technology: element.technology, tags: __spreadArray([], element.tags, true), links: null, color: (_h = inheritFromNodeOrAncestor === null || inheritFromNodeOrAncestor === void 0 ? void 0 : inheritFromNodeOrAncestor.color) !== null && _h !== void 0 ? _h : element.color, shape: (_j = inheritFromNode === null || inheritFromNode === void 0 ? void 0 : inheritFromNode.shape) !== null && _j !== void 0 ? _j : element.shape, icon: (_l = (_k = inheritFromNode === null || inheritFromNode === void 0 ? void 0 : inheritFromNode.icon) !== null && _k !== void 0 ? _k : element.icon) !== null && _l !== void 0 ? _l : 'none', modelRef: element.id, kind: element.kind, level: nodeLevel(id), labelBBox: {
                x: position.x,
                y: position.y,
                width: width,
                height: height,
            }, style: (0, remeda_1.omit)(__assign(__assign({}, (_m = (inheritFromNode !== null && inheritFromNode !== void 0 ? inheritFromNode : inheritFromNodeOrAncestor)) === null || _m === void 0 ? void 0 : _m.style), element.$element.style), ['color', 'shape', 'icon']), navigateTo: navigateTo }, (children.length > 0 && { depth: nodeDepth(id) })), { children: children, width: width, height: height, column: column, ports: {
                in: sortedPorts(id, 'in', inPorts),
                out: sortedPorts(id, 'out', outPorts),
            }, existsInCurrentView: !!inheritFromNode });
    });
    return {
        subjectExistsInScope: !scope || scope.includesElement(subject.id),
        bounds: {
            x: Math.min(minX, 0),
            y: Math.min(minY, 0),
            width: (_e = g.graph().width) !== null && _e !== void 0 ? _e : 100,
            height: (_f = g.graph().height) !== null && _f !== void 0 ? _f : 100,
        },
        nodes: nodes,
        edges: g.edges().reduce(function (acc, e) {
            var _a, _b, _c;
            var edge = g.edge(e);
            var ename = e.name;
            if (!ename) {
                return acc;
            }
            var _d = (0, utils_1.nonNullable)((0, remeda_1.find)(edges, function (e) { return e.name === ename; })), name = _d.name, source = _d.source, sourceFqn = _d.sourceFqn, target = _d.target, targetFqn = _d.targetFqn, relations = _d.relations, sourceHandle = _d.sourceHandle, targetHandle = _d.targetHandle;
            var onlyRelation = (0, remeda_1.only)(relations);
            var label = (_a = onlyRelation === null || onlyRelation === void 0 ? void 0 : onlyRelation.title) !== null && _a !== void 0 ? _a : 'untitled';
            var isMultiple = relations.length > 1;
            // const points = edge.points.map(p => [p.x, p.y] as Point)
            var navigateTo = (0, remeda_1.only)((0, remeda_1.unique)(relations.flatMap(function (r) { var _a; return ((_a = r.navigateTo) === null || _a === void 0 ? void 0 : _a.id) ? r.navigateTo.id : []; })));
            // edge.points
            // const edge = g.edge(name)
            acc.push((0, types_1.exact)({
                id: name,
                sourceFqn: sourceFqn,
                source: source,
                sourceHandle: sourceHandle,
                targetFqn: targetFqn,
                target: target,
                targetHandle: targetHandle,
                label: isMultiple ? "".concat(relations.length, " relationships") : label,
                navigateTo: navigateTo,
                color: (_b = onlyRelation === null || onlyRelation === void 0 ? void 0 : onlyRelation.color) !== null && _b !== void 0 ? _b : 'gray',
                existsInCurrentView: !scope || relations.every(function (r) { return scope.includesRelation(r.id); }),
                points: edge.points.map(function (p) { return [p.x, p.y]; }),
                line: (_c = onlyRelation === null || onlyRelation === void 0 ? void 0 : onlyRelation.line) !== null && _c !== void 0 ? _c : 'dashed',
                head: onlyRelation === null || onlyRelation === void 0 ? void 0 : onlyRelation.head,
                tail: onlyRelation === null || onlyRelation === void 0 ? void 0 : onlyRelation.tail,
                relations: relations.map(function (r) { return r.id; }),
                parent: null,
            }));
            return acc;
        }, []),
    };
}
function useRelationshipsView(subject, viewId, scope) {
    var model = (0, useLikeC4Model_1.useLikeC4Model)();
    return (0, react_1.useMemo)(function () {
        var view = viewId ? model.findView(viewId) : null;
        var data = layoutRelationshipsView((0, compute_view_1.computeRelationshipsView)(subject, model, viewId, scope), scope === 'view' ? view : null);
        if (view && (scope === 'global' || !data.subjectExistsInScope)) {
            data.edges = data.edges.map(function (edge) {
                edge.existsInCurrentView = edge.relations.every(function (r) { return view.includesRelation(r); });
                return edge;
            });
        }
        return Object.assign(data, { subject: subject });
    }, [model, subject, viewId, scope, compute_view_1.computeRelationshipsView]);
}
