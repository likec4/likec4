"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var aligners_1 = require("./aligners");
var placementError = 5;
function n(id, x, y, width, height) {
    if (width === void 0) { width = 20; }
    if (height === void 0) { height = 20; }
    return {
        id: id,
        x: x,
        y: y,
        width: width,
        height: height,
    };
}
(0, vitest_1.describe)('aligners', function () {
    (0, vitest_1.describe)('GridAligner', function () {
        (0, vitest_1.it)('centers node if there is only one node in a row', function () {
            var nodeRects = [
                n('a', 0, 0),
                n('b', 80, 40),
            ];
            var aligner = new aligners_1.GridAligner('Row');
            aligner.computeLayout(nodeRects);
            (0, vitest_1.expect)(aligner.applyPosition(nodeRects[0])).toEqual({ x: 40, y: 0 });
            (0, vitest_1.expect)(aligner.applyPosition(nodeRects[1])).toEqual({ x: 40, y: 40 });
        });
        (0, vitest_1.it)('groups overlapping nodes in a row and aligns top', function () {
            var nodeRects = [
                n('a', 0, 10),
                n('b', 40, 20),
                n('c', 80, 30),
            ];
            var aligner = new aligners_1.GridAligner('Row');
            aligner.computeLayout(nodeRects);
            (0, vitest_1.expect)(aligner.applyPosition(nodeRects[0]).y).toEqual(10);
            (0, vitest_1.expect)(aligner.applyPosition(nodeRects[1]).y).toEqual(10);
            (0, vitest_1.expect)(aligner.applyPosition(nodeRects[2]).y).toEqual(10);
        });
        (0, vitest_1.it)('spreads nodes in a row with equal space if this fits best to original layout', function () {
            var nodeRects = [
                n('a', 0, 0),
                n('b', 20, 0),
                n('c', 80, 0),
            ];
            var aligner = new aligners_1.GridAligner('Row');
            aligner.computeLayout(nodeRects);
            (0, vitest_1.expect)(aligner.applyPosition(nodeRects[0])).toEqual({ x: 0, y: 0 });
            (0, vitest_1.expect)(aligner.applyPosition(nodeRects[1])).toEqual({ x: 40, y: 0 });
            (0, vitest_1.expect)(aligner.applyPosition(nodeRects[2])).toEqual({ x: 80, y: 0 });
        });
        (0, vitest_1.it)('aligns with nodes in previous row if this fits best to original layout', function () {
            var nodeRects = [
                n('a', 0, 0),
                n('b', 40, 0),
                n('c', 80, 0),
                n('d', 120, 0),
                n('e', 40 + placementError, 40),
                n('f', 80 - placementError, 40),
            ];
            var aligner = new aligners_1.GridAligner('Row');
            aligner.computeLayout(nodeRects);
            (0, vitest_1.expect)(aligner.applyPosition(nodeRects[4])).toEqual({ x: 40, y: 40 });
            (0, vitest_1.expect)(aligner.applyPosition(nodeRects[5])).toEqual({ x: 80, y: 40 });
        });
        (0, vitest_1.it)('aligns with gaps in previous row if this fits best to original layout', function () {
            var nodeRects = [
                n('a', 0, 0),
                n('b', 40, 0),
                n('c', 80, 0),
                n('d', 120, 0),
                n('e', 20 + placementError, 40),
                n('f', 60 - placementError, 40),
            ];
            var aligner = new aligners_1.GridAligner('Row');
            aligner.computeLayout(nodeRects);
            (0, vitest_1.expect)(aligner.applyPosition(nodeRects[4])).toEqual({ x: 20, y: 40 });
            (0, vitest_1.expect)(aligner.applyPosition(nodeRects[5])).toEqual({ x: 60, y: 40 });
        });
        (0, vitest_1.it)('skips cell if previous layer has more cells than nodes in the current layer and it fits better', function () {
            var nodeRects = [
                n('a', 0, 0),
                n('b', 40, 0),
                n('c', 80, 0),
                n('d', 120, 0),
                n('e', 160, 0),
                n('f', 40 - placementError, 40),
                n('g', 80 - placementError, 40),
                n('h', 120 - placementError, 40),
                n('i', 160 - placementError, 40),
            ];
            var aligner = new aligners_1.GridAligner('Row');
            aligner.computeLayout(nodeRects);
            (0, vitest_1.expect)(aligner.applyPosition(nodeRects[5])).toEqual({ x: 40, y: 40 });
            (0, vitest_1.expect)(aligner.applyPosition(nodeRects[6])).toEqual({ x: 80, y: 40 });
            (0, vitest_1.expect)(aligner.applyPosition(nodeRects[7])).toEqual({ x: 120, y: 40 });
            (0, vitest_1.expect)(aligner.applyPosition(nodeRects[8])).toEqual({ x: 160, y: 40 });
        });
        (0, vitest_1.it)('uses secondary axis to order rows in a row', function () {
            var nodeRects = [
                n('e', 160, 0),
                n('b', 40, 0),
                n('a', 0, 0),
                n('d', 120, 0),
                n('c', 80, 0),
                n('f', 40 - placementError, 40),
                n('g', 80 - placementError, 40),
                n('h', 120 - placementError, 40),
                n('i', 160 - placementError, 40),
            ];
            var aligner = new aligners_1.GridAligner('Row');
            aligner.computeLayout(nodeRects);
            (0, vitest_1.expect)(aligner.applyPosition(nodeRects[5])).toEqual({ x: 40, y: 40 });
            (0, vitest_1.expect)(aligner.applyPosition(nodeRects[6])).toEqual({ x: 80, y: 40 });
            (0, vitest_1.expect)(aligner.applyPosition(nodeRects[7])).toEqual({ x: 120, y: 40 });
            (0, vitest_1.expect)(aligner.applyPosition(nodeRects[8])).toEqual({ x: 160, y: 40 });
        });
        (0, vitest_1.it)('spreads rows evenly', function () {
            var nodeRects = [
                n('a', 0, 0),
                n('b', 0, 40),
                n('c', 0, 80),
                n('d', 0, 120),
                n('e', 40, 120),
                n('f', 0, 160),
            ];
            var aligner = new aligners_1.GridAligner('Row');
            aligner.computeLayout(nodeRects);
            (0, vitest_1.expect)(aligner.applyPosition(nodeRects[0]).y).toEqual(0);
            (0, vitest_1.expect)(aligner.applyPosition(nodeRects[1]).y).toEqual(40);
            (0, vitest_1.expect)(aligner.applyPosition(nodeRects[2]).y).toEqual(80);
            (0, vitest_1.expect)(aligner.applyPosition(nodeRects[3]).y).toEqual(120);
            (0, vitest_1.expect)(aligner.applyPosition(nodeRects[4]).y).toEqual(120);
            (0, vitest_1.expect)(aligner.applyPosition(nodeRects[5]).y).toEqual(160);
        });
    });
    (0, vitest_1.describe)('LinearAligner', function () {
        (0, vitest_1.it)('aligns to leftmost edge', function () {
            var nodeRects = [
                n('a', 20, 10),
                n('b', 10, 20),
                n('c', 40, 30),
            ];
            var aligner = (0, aligners_1.getLinearAligner)('Left');
            aligner.computeLayout(nodeRects);
            (0, vitest_1.expect)(aligner.applyPosition(nodeRects[0])).toEqual({ x: 10 });
            (0, vitest_1.expect)(aligner.applyPosition(nodeRects[1])).toEqual({ x: 10 });
            (0, vitest_1.expect)(aligner.applyPosition(nodeRects[2])).toEqual({ x: 10 });
        });
        (0, vitest_1.it)('aligns rightmost edge', function () {
            var nodeRects = [
                n('a', 20, 10, 5),
                n('b', 10, 20, 6),
                n('c', 40, 30, 7),
            ];
            var aligner = (0, aligners_1.getLinearAligner)('Right');
            aligner.computeLayout(nodeRects);
            (0, vitest_1.expect)(aligner.applyPosition(nodeRects[0])).toEqual({ x: 42 });
            (0, vitest_1.expect)(aligner.applyPosition(nodeRects[1])).toEqual({ x: 41 });
            (0, vitest_1.expect)(aligner.applyPosition(nodeRects[2])).toEqual({ x: 40 });
        });
        (0, vitest_1.it)('aligns topmost edge', function () {
            var nodeRects = [
                n('a', 10, 20),
                n('b', 20, 10),
                n('c', 30, 40),
            ];
            var aligner = (0, aligners_1.getLinearAligner)('Top');
            aligner.computeLayout(nodeRects);
            (0, vitest_1.expect)(aligner.applyPosition(nodeRects[0])).toEqual({ y: 10 });
            (0, vitest_1.expect)(aligner.applyPosition(nodeRects[1])).toEqual({ y: 10 });
            (0, vitest_1.expect)(aligner.applyPosition(nodeRects[2])).toEqual({ y: 10 });
        });
        (0, vitest_1.it)('aligns bottommost edge', function () {
            var nodeRects = [
                n('a', 10, 20, 10, 5),
                n('b', 20, 10, 10, 6),
                n('c', 30, 40, 10, 7),
            ];
            var aligner = (0, aligners_1.getLinearAligner)('Bottom');
            aligner.computeLayout(nodeRects);
            (0, vitest_1.expect)(aligner.applyPosition(nodeRects[0])).toEqual({ y: 42 });
            (0, vitest_1.expect)(aligner.applyPosition(nodeRects[1])).toEqual({ y: 41 });
            (0, vitest_1.expect)(aligner.applyPosition(nodeRects[2])).toEqual({ y: 40 });
        });
        (0, vitest_1.it)('aligns to leftmost node center', function () {
            var nodeRects = [
                n('a', 20, 10, 4), // 22
                n('b', 10, 20, 8), // 14
                n('c', 40, 30, 12), // 46
            ];
            var aligner = (0, aligners_1.getLinearAligner)('Center');
            aligner.computeLayout(nodeRects);
            (0, vitest_1.expect)(aligner.applyPosition(nodeRects[0])).toEqual({ x: 12 });
            (0, vitest_1.expect)(aligner.applyPosition(nodeRects[1])).toEqual({ x: 10 });
            (0, vitest_1.expect)(aligner.applyPosition(nodeRects[2])).toEqual({ x: 8 });
        });
        (0, vitest_1.it)('aligns to topmost node middle', function () {
            var nodeRects = [
                n('a', 10, 20, 10, 4), // 22
                n('b', 20, 10, 10, 8), // 14
                n('c', 30, 40, 10, 12), // 46
            ];
            var aligner = (0, aligners_1.getLinearAligner)('Middle');
            aligner.computeLayout(nodeRects);
            (0, vitest_1.expect)(aligner.applyPosition(nodeRects[0])).toEqual({ y: 12 });
            (0, vitest_1.expect)(aligner.applyPosition(nodeRects[1])).toEqual({ y: 10 });
            (0, vitest_1.expect)(aligner.applyPosition(nodeRects[2])).toEqual({ y: 8 });
        });
    });
});
