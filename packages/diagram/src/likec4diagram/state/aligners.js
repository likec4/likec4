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
exports.GridAligner = exports.LinearAligner = exports.Aligner = void 0;
exports.getLinearAligner = getLinearAligner;
exports.toNodeRect = toNodeRect;
exports.getAligner = getAligner;
var core_1 = require("@likec4/core");
var system_1 = require("@xyflow/system");
var remeda_1 = require("remeda");
var Aligner = /** @class */ (function () {
    function Aligner() {
    }
    return Aligner;
}());
exports.Aligner = Aligner;
var LinearAligner = /** @class */ (function (_super) {
    __extends(LinearAligner, _super);
    function LinearAligner(getEdgePosition, computePosition, propertyToEdit) {
        var _this = _super.call(this) || this;
        _this.getEdgePosition = getEdgePosition;
        _this.computePosition = computePosition;
        _this.propertyToEdit = propertyToEdit;
        return _this;
    }
    LinearAligner.prototype.computeLayout = function (nodes) {
        this.alignTo = this.getEdgePosition(nodes);
    };
    LinearAligner.prototype.applyPosition = function (node) {
        var _a;
        return _a = {},
            _a[this.propertyToEdit] = this.computePosition(this.alignTo, node),
            _a;
    };
    return LinearAligner;
}(Aligner));
exports.LinearAligner = LinearAligner;
var GridAligner = /** @class */ (function (_super) {
    __extends(GridAligner, _super);
    function GridAligner(alignmentMode) {
        var _this = _super.call(this) || this;
        _this.layout = new Map();
        _this.axisPreset = alignmentMode === 'Column'
            ? {
                primaryAxisDimension: 'width',
                secondaryAxisDimension: 'height',
                primaryAxisCoord: 'x',
                secondaryAxisCoord: 'y',
            }
            : {
                primaryAxisDimension: 'height',
                secondaryAxisDimension: 'width',
                primaryAxisCoord: 'y',
                secondaryAxisCoord: 'x',
            };
        return _this;
    }
    Object.defineProperty(GridAligner.prototype, "primaryAxisCoord", {
        get: function () {
            return this.axisPreset.primaryAxisCoord;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(GridAligner.prototype, "secondaryAxisCoord", {
        get: function () {
            return this.axisPreset.secondaryAxisCoord;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(GridAligner.prototype, "primaryAxisDimension", {
        get: function () {
            return this.axisPreset.primaryAxisDimension;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(GridAligner.prototype, "secondaryAxisDimension", {
        get: function () {
            return this.axisPreset.secondaryAxisDimension;
        },
        enumerable: false,
        configurable: true
    });
    GridAligner.prototype.applyPosition = function (node) {
        var _a, _b;
        return (_b = (_a = this.layout) === null || _a === void 0 ? void 0 : _a.get(node.id)) !== null && _b !== void 0 ? _b : {};
    };
    GridAligner.prototype.computeLayout = function (nodes) {
        var _this = this;
        // Sort by primary axis
        var sortedNodeRects = (0, remeda_1.pipe)(nodes, (0, remeda_1.sortBy)(function (r) { return r[_this.primaryAxisCoord]; }));
        var layoutRect = this.getLayoutRect(sortedNodeRects);
        var layers = this.getLayers(sortedNodeRects);
        this.layout = this.buildLayout(layers, layoutRect, sortedNodeRects);
    };
    GridAligner.prototype.getLayoutRect = function (nodeRects) {
        var x = Math.min.apply(Math, nodeRects.map(function (n) { return n.x; }));
        var y = Math.min.apply(Math, nodeRects.map(function (n) { return n.y; }));
        var right = Math.max.apply(Math, nodeRects.map(function (n) { return n.x + n.width; }));
        var bottom = Math.max.apply(Math, nodeRects.map(function (n) { return n.y + n.height; }));
        return {
            x: x,
            y: y,
            width: right - x,
            height: bottom - y,
        };
    };
    GridAligner.prototype.getLayers = function (sortedNodeRects) {
        var _this = this;
        var layers = [];
        var layerEnd = 0;
        var layer = null;
        for (var _i = 0, sortedNodeRects_1 = sortedNodeRects; _i < sortedNodeRects_1.length; _i++) {
            var node = sortedNodeRects_1[_i];
            if (!!layer && node[this.primaryAxisCoord] < layerEnd) {
                layer.nodes.push(node);
                layer.primaryAxisSize = Math.max(layer.primaryAxisSize, node[this.primaryAxisDimension]);
                layer.occupiedSpace += node[this.secondaryAxisDimension];
                layerEnd = Math.max(node[this.primaryAxisCoord] + node[this.primaryAxisDimension], layerEnd);
            }
            else {
                layer = {
                    primaryAxisSize: node[this.primaryAxisDimension],
                    nodes: [node],
                    occupiedSpace: node[this.secondaryAxisDimension],
                    layout: null,
                };
                layers.push(layer);
                layerEnd = node[this.primaryAxisCoord] + node[this.primaryAxisDimension];
                continue;
            }
        }
        layers.forEach(function (l) { return l.nodes.sort(function (a, b) { return a[_this.secondaryAxisCoord] - b[_this.secondaryAxisCoord]; }); });
        return layers;
    };
    GridAligner.prototype.buildLayout = function (layers, layoutRect, nodeRects) {
        var _a, _b;
        var nodeMap = new Map(nodeRects.map(function (n) { return [n.id, n]; }));
        var layout = [];
        var occupiedSpace = layers.reduce(function (a, b) { return a + b.primaryAxisSize; }, 0);
        var rowMargin = layers.length > 1
            ? (layoutRect[this.primaryAxisDimension] - occupiedSpace) / (layers.length - 1)
            : 0;
        // Find the widest layer and layout diagram from there
        var baseLayerIndex = layers.reduce(function (widestLayerIndex, layer, i) {
            return layers[widestLayerIndex].occupiedSpace < layer.occupiedSpace ? i : widestLayerIndex;
        }, 0);
        var baseLayer = layers[baseLayerIndex];
        var baseLayerPosition = layers.slice(0, baseLayerIndex).reduce(function (a, layer) { return a + layer.primaryAxisSize + rowMargin; }, layoutRect[this.primaryAxisCoord]);
        var baseLayerLayout = this.buildLayerLayout(baseLayer, layoutRect, baseLayerPosition, nodeMap, null);
        baseLayer.layout = baseLayerLayout;
        layout.push.apply(layout, baseLayerLayout.nodePositions);
        // Layout layers after the base layer
        var placeNextLayerAt = baseLayerPosition + baseLayer.primaryAxisSize + rowMargin;
        var refLayer = baseLayer;
        for (var i = baseLayerIndex + 1; i < layers.length; i++) {
            var layer = layers[i];
            layer.layout = this.buildLayerLayout(layer, layoutRect, placeNextLayerAt, nodeMap, refLayer);
            layout.push.apply(layout, layer.layout.nodePositions);
            refLayer = (_a = layer.layout.refLayer) !== null && _a !== void 0 ? _a : layer;
            placeNextLayerAt += layer.primaryAxisSize + rowMargin;
        }
        // Layout layers before the base layer
        placeNextLayerAt = baseLayerPosition;
        refLayer = baseLayer;
        for (var i = baseLayerIndex - 1; i >= 0; i--) {
            var layer = layers[i];
            placeNextLayerAt -= layer.primaryAxisSize + rowMargin;
            layer.layout = this.buildLayerLayout(layer, layoutRect, placeNextLayerAt, nodeMap, refLayer);
            layout.push.apply(layout, layer.layout.nodePositions);
            refLayer = (_b = layer.layout.refLayer) !== null && _b !== void 0 ? _b : layer;
        }
        return new Map(layout);
    };
    GridAligner.prototype.buildLayerLayout = function (layer, layoutRect, placeNextLayerAt, nodeMap, refLayer) {
        var bestLayerLayout = this.scoreLayout(this.spaceAround(layer, layoutRect, placeNextLayerAt), nodeMap);
        if (layer.nodes.length != 1) {
            var currentlayerLayout = this.scoreLayout(this.spaceBetween(layer, layoutRect, placeNextLayerAt), nodeMap);
            bestLayerLayout = currentlayerLayout[0] < bestLayerLayout[0] ? currentlayerLayout : bestLayerLayout;
        }
        if (refLayer && refLayer.nodes.length - 1 >= layer.nodes.length) {
            var currentlayerLayout = this.scoreLayout(this.placeInGaps(layer, placeNextLayerAt, refLayer), nodeMap);
            bestLayerLayout = currentlayerLayout[0] < bestLayerLayout[0] ? currentlayerLayout : bestLayerLayout;
        }
        if (refLayer && refLayer.nodes.length >= layer.nodes.length) {
            var currentlayerLayout = this.scoreLayout(this.placeInCells(layer, placeNextLayerAt, refLayer), nodeMap);
            bestLayerLayout = currentlayerLayout[0] < bestLayerLayout[0] ? currentlayerLayout : bestLayerLayout;
        }
        return bestLayerLayout[1];
    };
    GridAligner.prototype.spaceBetween = function (layer, layoutRect, placeNextLayerAt) {
        var _a;
        var freeSpace = layoutRect[this.secondaryAxisDimension] - layer.occupiedSpace;
        var margin = freeSpace / (layer.nodes.length - 1);
        var placeNextNodeAt = layoutRect[this.secondaryAxisCoord];
        var result = new Map();
        for (var _i = 0, _b = layer.nodes; _i < _b.length; _i++) {
            var node = _b[_i];
            result.set(node.id, (_a = {},
                _a[this.secondaryAxisCoord] = placeNextNodeAt,
                _a[this.primaryAxisCoord] = placeNextLayerAt,
                _a));
            placeNextNodeAt += node[this.secondaryAxisDimension] + margin;
        }
        return { nodePositions: result, refLayer: null };
    };
    GridAligner.prototype.spaceAround = function (layer, layoutRect, placeNextLayerAt) {
        var _a;
        var _this = this;
        var freeSpace = layoutRect[this.secondaryAxisDimension] - layer.occupiedSpace;
        var margin = freeSpace / (layer.nodes.length + 1);
        var placeNextNodeAt = layoutRect[this.secondaryAxisCoord] + margin;
        var result = new Map();
        for (var _i = 0, _b = (0, remeda_1.sortBy)(layer.nodes, function (n) { return n[_this.secondaryAxisCoord]; }); _i < _b.length; _i++) {
            var node = _b[_i];
            result.set(node.id, (_a = {},
                _a[this.secondaryAxisCoord] = placeNextNodeAt,
                _a[this.primaryAxisCoord] = placeNextLayerAt,
                _a));
            placeNextNodeAt += node[this.secondaryAxisDimension] + margin;
        }
        return { nodePositions: result, refLayer: null };
    };
    GridAligner.prototype.placeInGaps = function (layer, placeNextLayerAt, refLayer) {
        var _a;
        var result = new Map();
        var nodes = layer.nodes;
        var placementOptions = this.getGapsPositions(refLayer);
        var optionIndex = 0;
        for (var i = 0, node = nodes[i]; i < nodes.length; i++, node = nodes[i]) {
            var nodeCenter = node[this.secondaryAxisCoord] + node[this.secondaryAxisDimension] / 2;
            var bestOffset = Infinity;
            while (optionIndex - i <= placementOptions.length - nodes.length) {
                var position = placementOptions[optionIndex];
                var offset = position - nodeCenter;
                if (Math.abs(offset) < Math.abs(bestOffset)) {
                    bestOffset = offset;
                    optionIndex++;
                }
                else {
                    break;
                }
            }
            result.set(node.id, (_a = {},
                _a[this.secondaryAxisCoord] = node[this.secondaryAxisCoord] + bestOffset,
                _a[this.primaryAxisCoord] = placeNextLayerAt,
                _a));
        }
        return { nodePositions: result, refLayer: refLayer };
    };
    GridAligner.prototype.placeInCells = function (layer, placeNextLayerAt, refLayer) {
        var _a;
        var result = new Map();
        var nodes = layer.nodes;
        var placementOptions = this.getNodePositions(refLayer);
        var optionIndex = 0;
        for (var i = 0, node = nodes[i]; i < nodes.length; i++, node = nodes[i]) {
            var nodeCenter = node[this.secondaryAxisCoord] + node[this.secondaryAxisDimension] / 2;
            var bestOffset = Infinity;
            while (optionIndex - i <= placementOptions.length - nodes.length) {
                var position = placementOptions[optionIndex];
                var offset = position - nodeCenter;
                if (Math.abs(offset) < Math.abs(bestOffset)) {
                    bestOffset = offset;
                    optionIndex++;
                }
                else {
                    break;
                }
            }
            result.set(node.id, (_a = {},
                _a[this.secondaryAxisCoord] = node[this.secondaryAxisCoord] + bestOffset,
                _a[this.primaryAxisCoord] = placeNextLayerAt,
                _a));
        }
        return { nodePositions: result, refLayer: refLayer };
    };
    GridAligner.prototype.scoreLayout = function (layout, originalRects) {
        var _this = this;
        return [
            (0, remeda_1.pipe)(Array.from(layout.nodePositions), (0, remeda_1.map)(function (_a) {
                var id = _a[0], position = _a[1];
                var originalRect = originalRects.get(id);
                (0, core_1.invariant)(originalRect, "Could not find original rect for node ".concat(id));
                return [(0, remeda_1.pick)(originalRect, ['x', 'y']), position];
            }), (0, remeda_1.map)(function (_a) {
                var original = _a[0], suggested = _a[1];
                return Math.abs(original[_this.secondaryAxisCoord] - suggested[_this.secondaryAxisCoord]);
            }), (0, remeda_1.reduce)(function (a, b) { return a + b; }, 0)),
            layout,
        ];
    };
    GridAligner.prototype.getGapsPositions = function (layer) {
        var result = [];
        var layout = layer.layout, nodes = layer.nodes;
        (0, core_1.invariant)(layout, 'Layout of the layer must be computed before calling getGapsPositions');
        for (var i = 1; i < nodes.length; i++) {
            var previousNode = nodes[i - 1];
            var currentNode = nodes[i];
            var previousNodePosition = layout.nodePositions.get(previousNode.id);
            var currentNodePosition = layout.nodePositions.get(currentNode.id);
            result.push((currentNodePosition[this.secondaryAxisCoord]
                + previousNodePosition[this.secondaryAxisCoord]
                + previousNode[this.secondaryAxisDimension]) / 2);
        }
        return result;
    };
    GridAligner.prototype.getNodePositions = function (layer) {
        var result = [];
        var layout = layer.layout, nodes = layer.nodes;
        (0, core_1.invariant)(layout, 'Layout of the layer must be computed before calling getGapsPositions');
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            var nodePosition = layout.nodePositions.get(node.id);
            result.push(nodePosition[this.secondaryAxisCoord]
                + node[this.secondaryAxisDimension] / 2);
        }
        return result;
    };
    return GridAligner;
}(Aligner));
exports.GridAligner = GridAligner;
function getLinearAligner(mode) {
    switch (mode) {
        case 'Left':
            return new LinearAligner(function (nodes) { return Math.min.apply(Math, nodes.map(function (n) { return n.x; })); }, function (alignTo, _) { return Math.floor(alignTo); }, 'x');
        case 'Top':
            return new LinearAligner(function (nodes) { return Math.min.apply(Math, nodes.map(function (n) { return n.y; })); }, function (alignTo, _) { return Math.floor(alignTo); }, 'y');
        case 'Right':
            return new LinearAligner(function (nodes) { return Math.max.apply(Math, nodes.map(function (n) { return n.x + n.width; })); }, function (alignTo, node) { return Math.floor(alignTo - node.width); }, 'x');
        case 'Bottom':
            return new LinearAligner(function (nodes) { return Math.max.apply(Math, nodes.map(function (n) { return n.y + n.height; })); }, function (alignTo, node) { return Math.floor(alignTo - node.height); }, 'y');
        case 'Center':
            return new LinearAligner(function (nodes) { return Math.min.apply(Math, nodes.map(function (n) { return n.x + n.width / 2; })); }, function (alignTo, node) { return Math.floor(alignTo - node.width / 2); }, 'x');
        case 'Middle':
            return new LinearAligner(function (nodes) { return Math.min.apply(Math, nodes.map(function (n) { return n.y + n.height / 2; })); }, function (alignTo, node) { return Math.floor(alignTo - node.height / 2); }, 'y');
    }
}
function toNodeRect(node) {
    var _a = (0, system_1.getNodeDimensions)(node), width = _a.width, height = _a.height;
    return __assign(__assign({}, node.internals.positionAbsolute), { id: node.id, width: width, height: height });
}
function getAligner(mode) {
    switch (mode) {
        case 'Left':
        case 'Right':
        case 'Top':
        case 'Bottom':
        case 'Center':
        case 'Middle':
            return getLinearAligner(mode);
        case 'Column':
        case 'Row':
            return new GridAligner(mode);
        default:
            (0, core_1.nonexhaustive)(mode);
    }
}
