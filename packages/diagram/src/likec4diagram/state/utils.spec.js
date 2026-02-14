"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var utils_1 = require("./utils");
(0, vitest_1.describe)('findNodeByModelFqn', function () {
    (0, vitest_1.it)('returns null when xynodes array is empty', function () {
        var result = (0, utils_1.findNodeByModelFqn)([], 'cloud.api');
        (0, vitest_1.expect)(result).toBeNull();
    });
    (0, vitest_1.it)('returns null when no node has matching modelFqn', function () {
        var xynodes = [
            { id: 'node1', data: { modelFqn: 'cloud.frontend' } },
            { id: 'node2', data: { modelFqn: 'cloud.backend' } },
        ];
        var result = (0, utils_1.findNodeByModelFqn)(xynodes, 'cloud.api');
        (0, vitest_1.expect)(result).toBeNull();
    });
    (0, vitest_1.it)('returns node when modelFqn matches', function () {
        var xynodes = [
            { id: 'node1', data: { modelFqn: 'cloud.frontend' } },
            { id: 'node2', data: { modelFqn: 'cloud.api' } },
            { id: 'node3', data: { modelFqn: 'cloud.backend' } },
        ];
        var result = (0, utils_1.findNodeByModelFqn)(xynodes, 'cloud.api');
        (0, vitest_1.expect)(result).toEqual({ id: 'node2', data: { modelFqn: 'cloud.api' } });
    });
    (0, vitest_1.it)('returns first matching node when multiple nodes have same modelFqn', function () {
        var xynodes = [
            { id: 'node1', data: { modelFqn: 'cloud.api' } },
            { id: 'node2', data: { modelFqn: 'cloud.api' } },
        ];
        var result = (0, utils_1.findNodeByModelFqn)(xynodes, 'cloud.api');
        (0, vitest_1.expect)(result).toEqual({ id: 'node1', data: { modelFqn: 'cloud.api' } });
    });
    (0, vitest_1.it)('returns null when node has null modelFqn', function () {
        var xynodes = [
            { id: 'node1', data: { modelFqn: null } },
        ];
        var result = (0, utils_1.findNodeByModelFqn)(xynodes, 'cloud.api');
        (0, vitest_1.expect)(result).toBeNull();
    });
    (0, vitest_1.it)('returns null when node has no modelFqn property', function () {
        var xynodes = [
            { id: 'node1', data: {} },
        ];
        var result = (0, utils_1.findNodeByModelFqn)(xynodes, 'cloud.api');
        (0, vitest_1.expect)(result).toBeNull();
    });
    (0, vitest_1.it)('handles nodes with mixed data shapes', function () {
        var xynodes = [
            { id: 'node1', data: {} }, // no modelFqn
            { id: 'node2', data: { modelFqn: null } }, // null modelFqn
            { id: 'node3', data: { modelFqn: 'cloud.frontend' } }, // different FQN
            { id: 'node4', data: { modelFqn: 'cloud.api' } }, // matching FQN
        ];
        var result = (0, utils_1.findNodeByModelFqn)(xynodes, 'cloud.api');
        (0, vitest_1.expect)(result).toEqual({ id: 'node4', data: { modelFqn: 'cloud.api' } });
    });
});
