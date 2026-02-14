"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testData = testData;
var remeda_1 = require("remeda");
var vitest_1 = require("vitest");
var fixture_1 = require("./__tests__/fixture");
var applyChangesToManualLayout_1 = require("./applyChangesToManualLayout");
function testData(patches) {
    var _a = (0, fixture_1.prepareFixtures)(patches), snapshot = _a.snapshot, snapshotNodes = _a.snapshotNodes, snapshotEdges = _a.snapshotEdges, layouted = _a.layouted, layoutedNodes = _a.layoutedNodes, layoutedEdges = _a.layoutedEdges;
    var result = (0, applyChangesToManualLayout_1.applyChangesToManualLayout)(snapshot, layouted);
    var resultNodes = (0, remeda_1.indexBy)(result.nodes, function (n) { return n.id; });
    var resultEdges = (0, remeda_1.indexBy)(result.edges, function (e) { return e.id; });
    return {
        result: result,
        resultNodes: resultNodes,
        resultEdges: resultEdges,
        manual: snapshot,
        manualNodes: snapshotNodes,
        manualEdges: snapshotEdges,
        latest: layouted,
        latestNodes: layoutedNodes,
        latestEdges: layoutedEdges,
    };
}
(0, vitest_1.describe)('applyChangesToManualLayout', function () {
    (0, vitest_1.it)('should take latestView as base structure', function (_a) {
        var expect = _a.expect;
        var _b = testData({}), result = _b.result, latest = _b.latest;
        // Result should have same nodes as latest (base)
        expect(result.nodes.length).toBe(latest.nodes.length);
        expect(result.edges.length).toBe(latest.edges.length);
        expect(result._layout).toBe('manual');
    });
    (0, vitest_1.it)('should preserve positions from manual layout', function (_a) {
        var expect = _a.expect;
        var _b = testData({
            nodes: {
                'saas.backend.api': {
                    title: 'Updated API',
                    color: 'secondary',
                },
            },
        }), resultNodes = _b.resultNodes, manualNodes = _b.manualNodes, latestNodes = _b.latestNodes;
        // Hierarchy comes from latest (base)
        expect(resultNodes['saas.backend'].children).toContain('saas.backend.api');
        expect(resultNodes['saas.backend.api'].parent).toBe('saas.backend');
        // Properties come from latest
        expect(resultNodes['saas.backend.api'].title).toBe('Updated API');
        // Position should be preserved from manual
        expect(resultNodes['saas.backend.api'].x).toBe(manualNodes['saas.backend.api'].x);
        expect(resultNodes['saas.backend.api'].y).toBe(manualNodes['saas.backend.api'].y);
        // Compound nodes should be expanded
        var saasBackend = resultNodes['saas.backend'];
        expect(saasBackend === null || saasBackend === void 0 ? void 0 : saasBackend.width).toBeGreaterThan(0);
        expect(saasBackend === null || saasBackend === void 0 ? void 0 : saasBackend.height).toBeGreaterThan(0);
    });
    (0, vitest_1.it)('should handle added nodes with their positions from latest', function (_a) {
        var expect = _a.expect;
        var _b = testData({
            nodes: {
                'saas.newservice': {
                    title: 'New Service',
                    x: 100,
                    y: 200,
                    width: 300,
                    height: 150,
                },
            },
        }), resultNodes = _b.resultNodes, latestNodes = _b.latestNodes;
        var newService = resultNodes['saas.newservice'];
        var saas = resultNodes['saas'];
        expect(newService).toBeDefined();
        expect(newService === null || newService === void 0 ? void 0 : newService.title).toBe('New Service');
        // New node uses position from latest
        expect(newService === null || newService === void 0 ? void 0 : newService.x).toBe(100);
        expect(newService === null || newService === void 0 ? void 0 : newService.y).toBe(200);
        // Parent is expanded to include new child
        if (saas && newService) {
            expect(saas.x).toBeLessThanOrEqual(newService.x);
            expect(saas.y).toBeLessThanOrEqual(newService.y);
            expect(saas.x + saas.width).toBeGreaterThanOrEqual(newService.x + newService.width);
            expect(saas.y + saas.height).toBeGreaterThanOrEqual(newService.y + newService.height);
        }
    });
    (0, vitest_1.it)('should use hierarchy from latest view', function (_a) {
        var _b, _c, _d, _e, _f;
        var expect = _a.expect;
        var _g = testData({
            nodes: {
                'saas.frontend.spa.dashboard': {
                    title: 'Dashboard',
                    x: 100,
                    y: 100,
                    width: 200,
                    height: 100,
                },
            },
        }), resultNodes = _g.resultNodes, latestNodes = _g.latestNodes;
        // All hierarchy comes from latest
        expect(resultNodes['saas.frontend.spa.dashboard']).toBeDefined();
        expect((_b = resultNodes['saas.frontend.spa.dashboard']) === null || _b === void 0 ? void 0 : _b.title).toBe('Dashboard');
        // Structure matches latest
        expect((_c = resultNodes['saas']) === null || _c === void 0 ? void 0 : _c.children).toEqual((_d = latestNodes['saas']) === null || _d === void 0 ? void 0 : _d.children);
        expect((_e = resultNodes['saas.frontend']) === null || _e === void 0 ? void 0 : _e.children).toEqual((_f = latestNodes['saas.frontend']) === null || _f === void 0 ? void 0 : _f.children);
    });
    (0, vitest_1.it)('should update view properties from latest', function (_a) {
        var expect = _a.expect;
        var _b = testData({
            view: {
                title: 'Updated Title',
                description: 'Updated Description',
            },
        }), result = _b.result, manual = _b.manual;
        expect(result.title).toBe('Updated Title');
        expect(result.description).toBe('Updated Description');
        expect(result.id).toBe(manual.id);
        expect(result._type).toBe(manual._type);
    });
    (0, vitest_1.it)('should recalculate bounds based on root nodes', function (_a) {
        var expect = _a.expect;
        var result = testData({}).result;
        var rootNodes = result.nodes.filter(function (n) { return !n.parent; });
        expect(rootNodes.length).toBeGreaterThan(0);
        // Bounds should encompass all root nodes
        for (var _i = 0, rootNodes_1 = rootNodes; _i < rootNodes_1.length; _i++) {
            var node = rootNodes_1[_i];
            expect(result.bounds.x).toBeLessThanOrEqual(node.x);
            expect(result.bounds.y).toBeLessThanOrEqual(node.y);
            expect(result.bounds.x + result.bounds.width).toBeGreaterThanOrEqual(node.x + node.width);
            expect(result.bounds.y + result.bounds.height).toBeGreaterThanOrEqual(node.y + node.height);
        }
    });
    (0, vitest_1.it)('should handle nodes with updated properties', function (_a) {
        var expect = _a.expect;
        var _b = testData({
            nodes: {
                'customer': {
                    title: 'Premium Customer',
                    color: 'blue',
                    shape: 'cylinder',
                },
                'saas.backend.api': {
                    title: 'API Gateway',
                    icon: 'tech:aws',
                    tags: ['api', 'gateway'],
                },
            },
        }), resultNodes = _b.resultNodes, manualNodes = _b.manualNodes;
        // Customer updates
        var customer = resultNodes['customer'];
        expect(customer === null || customer === void 0 ? void 0 : customer.title).toBe('Premium Customer');
        expect(customer === null || customer === void 0 ? void 0 : customer.color).toBe('blue');
        expect(customer === null || customer === void 0 ? void 0 : customer.shape).toBe('cylinder');
        // Position preserved
        expect(customer === null || customer === void 0 ? void 0 : customer.x).toBe(manualNodes['customer'].x);
        expect(customer === null || customer === void 0 ? void 0 : customer.y).toBe(manualNodes['customer'].y);
        // API updates
        var api = resultNodes['saas.backend.api'];
        expect(api.title).toBe('API Gateway');
        expect(api.icon).toBe('tech:aws');
        expect(api.tags).toEqual(['api', 'gateway']);
        // Position preserved
        expect(api.x).toBe(manualNodes['saas.backend.api'].x);
        expect(api.y).toBe(manualNodes['saas.backend.api'].y);
    });
    (0, vitest_1.it)('should handle deep nesting from latest', function (_a) {
        var expect = _a.expect;
        var _b = testData({
            nodes: {
                'saas.backend.api.v1': {
                    title: 'API v1',
                    parent: 'saas.backend.api',
                    x: 100,
                    y: 100,
                    width: 200,
                    height: 100,
                },
                'saas.backend.api': function (d) {
                    d.children.push('saas.backend.api.v1');
                },
            },
        }), resultNodes = _b.resultNodes, latestNodes = _b.latestNodes;
        var v1 = resultNodes['saas.backend.api.v1'];
        var api = resultNodes['saas.backend.api'];
        // Structure comes from latest
        expect(v1).toBeDefined();
        expect(v1.parent).toBe('saas.backend.api');
        expect(api.children).toContain('saas.backend.api.v1');
        // Position from latest for new node
        expect(v1.x).toBe(100);
        expect(v1.y).toBe(100);
    });
    (0, vitest_1.it)('should clear drift information', function (_a) {
        var _b, _c;
        var expect = _a.expect;
        var _d = testData({
            nodes: {
                'customer': function (d) {
                    d.drifts = ['added'];
                },
                'saas.backend.api': function (d) {
                    d.drifts = ['removed', 'added'];
                },
            },
        }), result = _d.result, resultNodes = _d.resultNodes;
        expect((_b = resultNodes['customer']) === null || _b === void 0 ? void 0 : _b.drifts).toBeNull();
        expect((_c = resultNodes['saas.backend.api']) === null || _c === void 0 ? void 0 : _c.drifts).toBeNull();
        // drifts should be undefined after clearing (property deleted)
        expect(result.drifts).toBeUndefined();
    });
    (0, vitest_1.it)('should handle compound nodes with padding', function (_a) {
        var expect = _a.expect;
        var resultNodes = testData({}).resultNodes;
        // Check that compound nodes wrap their children with padding
        var saasBackend = resultNodes['saas.backend'];
        var children = [
            resultNodes['saas.backend.api'],
            resultNodes['saas.backend.auth'],
            resultNodes['saas.backend.worker'],
        ].filter(function (n) { return !!n; });
        if (children.length > 0 && saasBackend) {
            // Find the bounding box of children
            var minX = Math.min.apply(Math, children.map(function (n) { return n.x; }));
            var minY = Math.min.apply(Math, children.map(function (n) { return n.y; }));
            var maxX = Math.max.apply(Math, children.map(function (n) { return n.x + n.width; }));
            var maxY = Math.max.apply(Math, children.map(function (n) { return n.y + n.height; }));
            // Parent should have padding around children (42, 60, 42, 42)
            expect(saasBackend.x).toBeLessThan(minX);
            expect(saasBackend.y).toBeLessThan(minY);
            expect(saasBackend.x + saasBackend.width).toBeGreaterThan(maxX);
            expect(saasBackend.y + saasBackend.height).toBeGreaterThan(maxY);
            // Check approximate padding (allowing for rounding)
            expect(minX - saasBackend.x).toBeCloseTo(42, 1);
            expect(minY - saasBackend.y).toBeCloseTo(60, 1);
        }
    });
    (0, vitest_1.it)('should maintain consistency between parent children arrays and child parent references', function (_a) {
        var expect = _a.expect;
        var _b = testData({}), result = _b.result, resultNodes = _b.resultNodes;
        // For each node with children, verify bidirectional relationship
        for (var _i = 0, _c = result.nodes; _i < _c.length; _i++) {
            var node = _c[_i];
            if (node.children.length > 0) {
                for (var _d = 0, _e = node.children; _d < _e.length; _d++) {
                    var childId = _e[_d];
                    var child = resultNodes[childId];
                    expect(child).toBeDefined();
                    expect(child === null || child === void 0 ? void 0 : child.parent).toBe(node.id);
                }
            }
            if (node.parent) {
                var parent_1 = resultNodes[node.parent];
                expect(parent_1).toBeDefined();
                expect(parent_1 === null || parent_1 === void 0 ? void 0 : parent_1.children).toContain(node.id);
            }
        }
    });
    (0, vitest_1.it)('should include edges between added nodes', function (_a) {
        var expect = _a.expect;
        var _b = testData({
            nodes: {
                'new.node1': {
                    title: 'New Node 1',
                    x: 100,
                    y: 100,
                    width: 200,
                    height: 100,
                },
                'new.node2': {
                    title: 'New Node 2',
                    x: 400,
                    y: 100,
                    width: 200,
                    height: 100,
                },
            },
            edges: {
                'new.node1:new.node2': {
                    source: 'new.node1',
                    target: 'new.node2',
                },
            },
        }), result = _b.result, resultEdges = _b.resultEdges, latestEdges = _b.latestEdges;
        // Should include edge between two added nodes
        expect(result.edges).toContain(latestEdges['new.node1:new.node2']);
    });
    (0, vitest_1.it)('should not include edges between added and existing nodes', function (_a) {
        var expect = _a.expect;
        var _b = testData({
            nodes: {
                'new.node': {
                    title: 'New Node',
                    x: 100,
                    y: 100,
                    width: 200,
                    height: 100,
                },
            },
            edges: {
                'new.node:customer': {
                    source: 'new.node',
                    target: 'customer',
                },
                'customer:new.node': {
                    source: 'customer',
                    target: 'new.node',
                },
            },
        }), result = _b.result, latestEdges = _b.latestEdges;
        // Should not include edges connecting to existing nodes
        expect(result.edges).not.toContain(latestEdges['new.node:customer']);
        expect(result.edges).not.toContain(latestEdges['customer:new.node']);
    });
});
