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
exports.computeEdgeDetailsViewData = computeEdgeDetailsViewData;
exports.computeRelationshipDetailsViewData = computeRelationshipDetailsViewData;
var compute_view_1 = require("@likec4/core/compute-view");
var model_1 = require("@likec4/core/model");
var utils_1 = require("@likec4/core/utils");
var remeda_1 = require("remeda");
var finalize = function (elements, explicits) {
    if (elements.size > 2 && explicits.size !== elements.size) {
        return new Set((0, utils_1.sortParentsFirst)(__spreadArray(__spreadArray([], (0, compute_view_1.treeFromElements)(elements).flatten(), true), explicits, true)));
    }
    if (elements.size > 1) {
        return new Set((0, utils_1.sortParentsFirst)(__spreadArray([], elements, true)));
    }
    return elements;
};
function computeEdgeDetailsViewData(edges, view) {
    var sources = new Set();
    var relationships = new Set();
    var targets = new Set();
    var explicit = {
        sources: new Set(),
        targets: new Set(),
    };
    var addExplicit = function (el, type) {
        if (type === 'source') {
            sources.add(el);
            explicit.sources.add(el);
        }
        else {
            targets.add(el);
            explicit.targets.add(el);
        }
    };
    for (var _i = 0, edges_1 = edges; _i < edges_1.length; _i++) {
        var edgeId = edges_1[_i];
        var edge = view.findEdge(edgeId);
        var _relationships = edge ? __spreadArray([], edge.relationships('model'), true) : [];
        if (!edge || !(0, remeda_1.hasAtLeast)(_relationships, 1) || !edge.source.hasElement() || !edge.target.hasElement()) {
            continue;
        }
        var source = edge.source.element;
        var target = edge.target.element;
        addExplicit(source, 'source');
        addExplicit(target, 'target');
        for (var _a = 0, _relationships_1 = _relationships; _a < _relationships_1.length; _a++) {
            var relationship = _relationships_1[_a];
            relationships.add(relationship);
            if (relationship.source !== source) {
                addExplicit(relationship.source, 'source');
                for (var _b = 0, _c = relationship.source.ancestors(); _b < _c.length; _b++) {
                    var parent_1 = _c[_b];
                    if (parent_1 === source) {
                        break;
                    }
                    sources.add(parent_1);
                }
            }
            if (relationship.target !== target) {
                addExplicit(relationship.target, 'target');
                for (var _d = 0, _e = relationship.target.ancestors(); _d < _e.length; _d++) {
                    var parent_2 = _e[_d];
                    if (parent_2 === target) {
                        break;
                    }
                    targets.add(parent_2);
                }
            }
        }
    }
    return {
        sources: finalize(sources, explicit.sources),
        targets: finalize(targets, explicit.targets),
        relationships: relationships,
    };
}
function computeRelationshipDetailsViewData(_a) {
    var 
    // relationships: _relationships,
    source = _a.source, target = _a.target;
    var sources = new Set();
    var relationships = new Set();
    var targets = new Set();
    var explicit = {
        sources: new Set(),
        targets: new Set(),
    };
    var addExplicit = function (el, type) {
        if (type === 'source') {
            sources.add(el);
            explicit.sources.add(el);
        }
        else {
            targets.add(el);
            explicit.targets.add(el);
        }
    };
    if (source) {
        addExplicit(source, 'source');
    }
    if (target) {
        addExplicit(target, 'target');
    }
    var connection = model_1.modelConnection.findConnection(source, target, 'directed')[0];
    if (!connection) {
        return {
            sources: sources,
            targets: targets,
            relationships: relationships,
        };
    }
    for (var _i = 0, _b = connection.relations; _i < _b.length; _i++) {
        var relationship = _b[_i];
        var relationSource = relationship.source;
        var relationTarget = relationship.target;
        addExplicit(relationSource, 'source');
        addExplicit(relationTarget, 'target');
        relationships.add(relationship);
        if (source !== relationSource) {
            (0, utils_1.invariant)((0, utils_1.isAncestor)(source, relationSource), "".concat(source.id, " is not an ancestor of ").concat(relationSource.id));
            for (var _c = 0, _d = relationSource.ancestors(); _c < _d.length; _c++) {
                var parent_3 = _d[_c];
                if (parent_3 === source) {
                    break;
                }
                sources.add(parent_3);
            }
        }
        if (target !== relationTarget) {
            (0, utils_1.invariant)((0, utils_1.isAncestor)(target, relationTarget), "".concat(target.id, " is not an ancestor of ").concat(relationTarget.id));
            for (var _e = 0, _f = relationTarget.ancestors(); _e < _f.length; _e++) {
                var parent_4 = _f[_e];
                if (parent_4 === target) {
                    break;
                }
                targets.add(parent_4);
            }
        }
    }
    return {
        sources: finalize(sources, explicit.sources),
        targets: finalize(targets, explicit.targets),
        relationships: relationships,
    };
}
