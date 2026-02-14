"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var utils_1 = require("./utils");
// Helpers
var node = function (id, parent) {
    if (parent === void 0) { parent = null; }
    return ({
        id: id,
        parent: parent,
    });
};
(0, vitest_1.describe)('buildCompounds', function () {
    (0, vitest_1.it)('should return empty when actors list equals nodes list (no compounds)', function () {
        var a = node('a');
        var b = node('b');
        var actors = [a, b];
        var nodes = [a, b];
        var compounds = (0, utils_1.buildCompounds)(actors, nodes);
        (0, vitest_1.expect)(compounds).toEqual([]);
    });
    (0, vitest_1.it)('should create a single-level compound for actors sharing the same parent', function () {
        // hierarchy: p -> a1, a2
        var p1 = node('p1');
        var a1 = node('p1.a1', 'p1');
        var a2 = node('p1.a2', 'p1');
        var p2 = node('p2');
        var a3 = node('p2.a3', 'p2');
        var nodes = [p1, p2, a1, a2, a3];
        var actors = [a1, a2, a3];
        var compounds = (0, utils_1.buildCompounds)(actors, nodes);
        (0, vitest_1.expect)(compounds).toEqual([
            {
                node: p1,
                from: a1,
                to: a2,
                nested: [],
            },
            {
                node: p2,
                from: a3,
                to: a3,
                nested: [],
            },
        ]);
    });
    (0, vitest_1.it)('should detect "holes" in the sequence', function () {
        // hierarchy: p -> a1, a2
        // Sequence: a1, a2
        var p1 = node('p');
        var a1 = node('a1');
        var a2 = node('p.a2', 'p');
        var a3 = node('a3');
        var a4 = node('p.a4', 'p');
        var nodes = [p1, a1, a2, a3, a4];
        var actors = [a1, a2, a3, a4];
        var compounds = (0, utils_1.buildCompounds)(actors, nodes);
        (0, vitest_1.expect)(compounds).toEqual([
            {
                node: p1,
                from: a2,
                to: a2,
                nested: [],
            },
            {
                node: p1,
                from: a4,
                to: a4,
                nested: [],
            },
        ]);
    });
    (0, vitest_1.it)('should create nested compounds for multi-level ancestry', function () {
        // hierarchy: p -> c -> a1, a2
        var p = node('p');
        var c = node('p.c', 'p');
        var a1 = node('p.c.a1', 'p.c');
        var a2 = node('p.c.a2', 'p.c');
        var nodes = [p, c, a1, a2];
        var actors = [a1, a2];
        var compounds = (0, utils_1.buildCompounds)(actors, nodes);
        (0, vitest_1.expect)(compounds).toEqual([
            {
                node: p,
                from: a1,
                to: a2,
                nested: [
                    {
                        node: c,
                        from: a1,
                        to: a2,
                        nested: [],
                    },
                ],
            },
        ]);
    });
    (0, vitest_1.it)('should update compound span when actors revisit the same parent later', function () {
        // hierarchy: p -> c1 -> a1, a2; p -> c2 -> b1
        var p = node('p');
        var c1 = node('p.c1', 'p');
        var c2 = node('p.c2', 'p');
        var a1 = node('p.c1.a1', 'p.c1');
        var a2 = node('p.c1.a2', 'p.c1');
        var b1 = node('p.c2.b1', 'p.c2');
        var b2 = node('p.c2.b2', 'p.c2');
        var nodes = [p, c1, c2, a1, a2, b1, b2];
        // Sequence: a1 (c1), b1 (c2), a2 (c1)
        var actors = [a1, b1, b2, a2];
        var compounds = (0, utils_1.buildCompounds)(actors, nodes);
        // Top-level compound is p, spanning from first actor to last actor (a1 -> a2)
        (0, vitest_1.expect)(compounds).toHaveLength(1);
        var top = compounds[0];
        (0, vitest_1.expect)(top.node.id).toBe('p');
        (0, vitest_1.expect)(top.from.id).toBe('p.c1.a1');
        (0, vitest_1.expect)(top.to.id).toBe('p.c1.a2');
        // Inside, there should be thre nested compounds for c1,c2,c1 in order of first encounter
        (0, vitest_1.expect)(top.nested).toHaveLength(3);
        var firstNested = top.nested[0];
        var secondNested = top.nested[1];
        var thirdNested = top.nested[2];
        // c1 first opens at a1
        (0, vitest_1.expect)(firstNested).toEqual({
            node: c1,
            from: a1,
            to: a1,
            nested: [],
        });
        // c2 spans only for b1 occurrence
        (0, vitest_1.expect)(secondNested).toEqual({
            node: c2,
            from: b1,
            to: b2,
            nested: [],
        });
        (0, vitest_1.expect)(thirdNested).toEqual({
            node: c1,
            from: a2,
            to: a2,
            nested: [],
        });
    });
});
