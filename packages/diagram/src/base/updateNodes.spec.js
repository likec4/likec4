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
var system_1 = require("@xyflow/system");
var vitest_1 = require("vitest");
var updateNodes_1 = require("./updateNodes");
function createNode(id, overrides) {
    if (overrides === void 0) { overrides = {}; }
    return __assign({ id: id, type: 'default', position: { x: 0, y: 0 }, initialWidth: 100, initialHeight: 50, data: {
            label: id,
        } }, overrides);
}
(0, vitest_1.describe)('updateNodes', function () {
    (0, vitest_1.describe)('basic updates', function () {
        (0, vitest_1.it)('returns same array when nodes are equal', function () {
            var current = [
                createNode('node1'),
                createNode('node2'),
            ];
            var update = [
                createNode('node1'),
                createNode('node2'),
            ];
            var result = (0, updateNodes_1.updateNodes)(current, update);
            (0, vitest_1.expect)(result).toBe(current);
        });
        (0, vitest_1.it)('adds new nodes that do not exist', function () {
            var current = [createNode('node1')];
            var update = [
                createNode('node1'),
                createNode('node2'),
            ];
            var result = (0, updateNodes_1.updateNodes)(current, update);
            (0, vitest_1.expect)(result).not.toBe(current);
            (0, vitest_1.expect)(result).toHaveLength(2);
            // Preserves existing node
            (0, vitest_1.expect)(result[0]).toBe(current[0]);
            // Adds new node
            (0, vitest_1.expect)(result[1]).toBe(update[1]);
        });
        (0, vitest_1.it)('returns new array when node is removed', function () {
            var current = [
                createNode('node1'),
                createNode('node2'),
            ];
            var update = [createNode('node1')];
            var result = (0, updateNodes_1.updateNodes)(current, update);
            (0, vitest_1.expect)(result).not.toBe(current);
            (0, vitest_1.expect)(result).toHaveLength(1);
            // Preserves existing node
            (0, vitest_1.expect)(result[0]).toBe(current[0]);
        });
        (0, vitest_1.it)('replaces node when type changes', function () {
            var current = [createNode('node1', { type: 'type1' })];
            var update = [createNode('node1', { type: 'type2' })];
            var result = (0, updateNodes_1.updateNodes)(current, update);
            (0, vitest_1.expect)(result).not.toBe(current);
            (0, vitest_1.expect)(result[0]).toBe(update[0]);
        });
    });
    (0, vitest_1.describe)('position updates', function () {
        (0, vitest_1.it)('updates node position', function () {
            var _a;
            var current = [createNode('node1', { position: { x: 0, y: 0 } })];
            var update = [createNode('node1', { position: { x: 100, y: 50 } })];
            var result = (0, updateNodes_1.updateNodes)(current, update);
            (0, vitest_1.expect)(result).not.toBe(current);
            (0, vitest_1.expect)(result[0]).not.toBe(current[0]);
            (0, vitest_1.expect)((_a = result[0]) === null || _a === void 0 ? void 0 : _a.position).toEqual({ x: 100, y: 50 });
        });
        (0, vitest_1.it)('preserves existing node when position is the same', function () {
            var current = [createNode('node1', { position: { x: 100, y: 50 } })];
            var update = [createNode('node1', { position: { x: 100, y: 50 } })];
            var result = (0, updateNodes_1.updateNodes)(current, update);
            (0, vitest_1.expect)(result).toBe(current);
            (0, vitest_1.expect)(result[0]).toBe(current[0]);
        });
    });
    (0, vitest_1.describe)('dimension updates', function () {
        (0, vitest_1.it)('updates node dimensions', function () {
            var _a, _b, _c, _d, _e;
            var current = [
                createNode('node1', {
                    initialWidth: 100,
                    initialHeight: 50,
                    measured: { width: 100, height: 50 },
                }),
            ];
            var update = [
                createNode('node1', { initialWidth: 200, initialHeight: 100 }),
            ];
            var result = (0, updateNodes_1.updateNodes)(current, update);
            (0, vitest_1.expect)(result).not.toBe(current);
            (0, vitest_1.expect)(result[0]).not.toBe(current[0]);
            (0, vitest_1.expect)((_a = result[0]) === null || _a === void 0 ? void 0 : _a.initialWidth).toBe(200);
            (0, vitest_1.expect)((_b = result[0]) === null || _b === void 0 ? void 0 : _b.initialHeight).toBe(100);
            (0, vitest_1.expect)((_c = result[0]) === null || _c === void 0 ? void 0 : _c.measured).toEqual({ width: 200, height: 100 });
            (0, vitest_1.expect)((_d = result[0]) === null || _d === void 0 ? void 0 : _d.width).toBe(200);
            (0, vitest_1.expect)((_e = result[0]) === null || _e === void 0 ? void 0 : _e.height).toBe(100);
        });
        (0, vitest_1.it)('preserves existing node when dimensions are the same', function () {
            var current = [
                createNode('node1', {
                    initialWidth: 100,
                    initialHeight: 50,
                    measured: { width: 100, height: 50 },
                    width: 100,
                    height: 50,
                }),
            ];
            var update = [
                createNode('node1', { initialWidth: 100, initialHeight: 50 }),
            ];
            var result = (0, updateNodes_1.updateNodes)(current, update);
            (0, vitest_1.expect)(result).toBe(current);
            (0, vitest_1.expect)(result[0]).toBe(current[0]);
        });
    });
    (0, vitest_1.describe)('data updates', function () {
        (0, vitest_1.it)('updates node data when changed', function () {
            var _a, _b;
            var current = [createNode('node1', { data: { label: 'old' } })];
            var update = [createNode('node1', { data: { label: 'new' } })];
            var result = (0, updateNodes_1.updateNodes)(current, update);
            (0, vitest_1.expect)(result).not.toBe(current);
            (0, vitest_1.expect)(result[0]).not.toBe(current[0]);
            (0, vitest_1.expect)((_a = result[0]) === null || _a === void 0 ? void 0 : _a.data).toBe((_b = update[0]) === null || _b === void 0 ? void 0 : _b.data);
        });
        (0, vitest_1.it)('preserves existing node when data is a superset', function () {
            var existingData = { label: 'node1', extra: 'data' };
            var current = [createNode('node1', { data: existingData })];
            var update = [createNode('node1', { data: { label: 'node1' } })];
            var result = (0, updateNodes_1.updateNodes)(current, update);
            (0, vitest_1.expect)(result).toBe(current);
            (0, vitest_1.expect)(result[0]).toBe(current[0]);
        });
        (0, vitest_1.it)('preserves existing data object when data is a superset, but node has other changes', function () {
            var _a;
            var existingData = { label: 'label1', extra: 'data', hovered: true };
            var current = [createNode('node1', { data: existingData })];
            var update = [createNode('node1', { initialWidth: 32, data: { label: 'label1' } })];
            var result = (0, updateNodes_1.updateNodes)(current, update);
            (0, vitest_1.expect)(result).not.toBe(current);
            (0, vitest_1.expect)(result[0]).not.toBe(current[0]); // because dimensions changed
            (0, vitest_1.expect)((_a = result[0]) === null || _a === void 0 ? void 0 : _a.data).toBe(existingData);
        });
        (0, vitest_1.it)('updates when existing data is not a superset of new data', function () {
            var _a;
            var current = [createNode('node1', { data: { label: 'node1' } })];
            var update = [
                createNode('node1', { data: { label: 'node1', dimmed: 'immediate' } }),
            ];
            var result = (0, updateNodes_1.updateNodes)(current, update);
            (0, vitest_1.expect)(result).not.toBe(current);
            (0, vitest_1.expect)(result[0]).not.toBe(current[0]); // because data changed
            (0, vitest_1.expect)((_a = result[0]) === null || _a === void 0 ? void 0 : _a.data).toBe(update[0].data);
        });
        (0, vitest_1.it)('preserves hovered state when data changes but hovered is not in update', function () {
            var _a, _b, _c, _d, _e;
            var current = [createNode('node1', { data: { label: 'old', hovered: true } })];
            var update = [createNode('node1', { data: { label: 'new' } })];
            var result = (0, updateNodes_1.updateNodes)(current, update);
            (0, vitest_1.expect)(result).not.toBe(current);
            (0, vitest_1.expect)(result[0]).not.toBe(current[0]);
            (0, vitest_1.expect)((_a = result[0]) === null || _a === void 0 ? void 0 : _a.data).not.toBe((_b = current[0]) === null || _b === void 0 ? void 0 : _b.data);
            (0, vitest_1.expect)((_c = result[0]) === null || _c === void 0 ? void 0 : _c.data).not.toBe((_d = update[0]) === null || _d === void 0 ? void 0 : _d.data);
            (0, vitest_1.expect)((_e = result[0]) === null || _e === void 0 ? void 0 : _e.data).toEqual({ label: 'new', hovered: true });
        });
        (0, vitest_1.it)('preserves dimmed state when data changes but dimmed is not in update', function () {
            var _a;
            var current = [createNode('node1', { data: { label: 'old', dimmed: 'immediate' } })];
            var update = [createNode('node1', { data: { label: 'new' } })];
            var result = (0, updateNodes_1.updateNodes)(current, update);
            (0, vitest_1.expect)(result).not.toBe(current);
            (0, vitest_1.expect)((_a = result[0]) === null || _a === void 0 ? void 0 : _a.data).toEqual({ label: 'new', dimmed: 'immediate' });
        });
        (0, vitest_1.it)('preserves both hovered and dimmed states when data changes', function () {
            var _a;
            var current = [createNode('node1', {
                    data: { label: 'old', hovered: true, dimmed: true },
                })];
            var update = [createNode('node1', { data: { label: 'new' } })];
            var result = (0, updateNodes_1.updateNodes)(current, update);
            (0, vitest_1.expect)(result).not.toBe(current);
            (0, vitest_1.expect)(result[0]).not.toBe(current[0]);
            (0, vitest_1.expect)((_a = result[0]) === null || _a === void 0 ? void 0 : _a.data).toEqual({ label: 'new', hovered: true, dimmed: true });
        });
        (0, vitest_1.it)('does not preserve hovered state when explicitly set to false in update', function () {
            var _a, _b, _c;
            var current = [createNode('node1', { data: { label: 'old', hovered: true } })];
            var update = [createNode('node1', { data: { label: 'new', hovered: false } })];
            var result = (0, updateNodes_1.updateNodes)(current, update);
            (0, vitest_1.expect)(result).not.toBe(current);
            (0, vitest_1.expect)(result[0]).not.toBe(current[0]);
            (0, vitest_1.expect)((_a = result[0]) === null || _a === void 0 ? void 0 : _a.data).toBe((_b = update[0]) === null || _b === void 0 ? void 0 : _b.data);
            (0, vitest_1.expect)((_c = result[0]) === null || _c === void 0 ? void 0 : _c.data.hovered).toBe(false);
        });
        (0, vitest_1.it)('does not preserve dimmed state when explicitly set in update', function () {
            var _a, _b, _c;
            var current = [createNode('node1', { data: { label: 'old', dimmed: 'immediate' } })];
            var update = [createNode('node1', { data: { label: 'new', dimmed: true } })];
            var result = (0, updateNodes_1.updateNodes)(current, update);
            (0, vitest_1.expect)(result).not.toBe(current);
            (0, vitest_1.expect)(result[0]).not.toBe(current[0]);
            (0, vitest_1.expect)((_a = result[0]) === null || _a === void 0 ? void 0 : _a.data).toBe((_b = update[0]) === null || _b === void 0 ? void 0 : _b.data);
            (0, vitest_1.expect)((_c = result[0]) === null || _c === void 0 ? void 0 : _c.data.dimmed).toBe(true);
        });
    });
    (0, vitest_1.describe)('parent updates', function () {
        (0, vitest_1.it)('updates parentId', function () {
            var _a;
            var current = [createNode('node1')];
            var update = [createNode('node1', { parentId: 'parent1' })];
            var result = (0, updateNodes_1.updateNodes)(current, update);
            (0, vitest_1.expect)(result).not.toBe(current);
            (0, vitest_1.expect)((_a = result[0]) === null || _a === void 0 ? void 0 : _a.parentId).toBe('parent1');
        });
        (0, vitest_1.it)('removes parentId when changed to undefined', function () {
            var _a;
            var current = [createNode('node1', { parentId: 'parent1' })];
            var update = [createNode('node1')];
            var result = (0, updateNodes_1.updateNodes)(current, update);
            (0, vitest_1.expect)(result).not.toBe(current);
            (0, vitest_1.expect)((_a = result[0]) === null || _a === void 0 ? void 0 : _a.parentId).toBeUndefined();
        });
        (0, vitest_1.it)('preserves existing node when parentId is the same', function () {
            var current = [createNode('node1', { parentId: 'parent1' })];
            var update = [createNode('node1', { parentId: 'parent1' })];
            var result = (0, updateNodes_1.updateNodes)(current, update);
            (0, vitest_1.expect)(result).toBe(current);
            (0, vitest_1.expect)(result[0]).toBe(current[0]);
        });
    });
    (0, vitest_1.describe)('measured dimensions', function () {
        (0, vitest_1.it)('does not assign measured property, if was not present in existing', function () {
            var _a, _b;
            var current = [
                createNode('node1', {
                    initialWidth: 100,
                    initialHeight: 50,
                }),
            ];
            var update = [
                createNode('node1', {
                    initialWidth: 200,
                    initialHeight: 100,
                }),
            ];
            var result = (0, updateNodes_1.updateNodes)(current, update);
            (0, vitest_1.expect)(result).not.toBe(current);
            (0, vitest_1.expect)(result[0]).not.toBe(current[0]);
            (0, vitest_1.expect)(result[0]).not.toBe(update[0]);
            (0, vitest_1.expect)(result[0]).not.toHaveProperty('measured');
            // Width and height are now forced in the implementation
            (0, vitest_1.expect)((_a = result[0]) === null || _a === void 0 ? void 0 : _a.width).toBe(200);
            (0, vitest_1.expect)((_b = result[0]) === null || _b === void 0 ? void 0 : _b.height).toBe(100);
        });
        (0, vitest_1.it)('forces dimensions from update in measured property', function () {
            var _a, _b, _c, _d, _e;
            var current = [
                createNode('node1', {
                    initialWidth: 100,
                    initialHeight: 50,
                    measured: { width: 120, height: 60 },
                }),
            ];
            var update = [
                createNode('node1', {
                    // should pick up these dimensions
                    width: 200,
                    height: 100,
                    // Should be ignored
                    initialWidth: 100,
                    initialHeight: 50,
                    position: { x: 0, y: 0 },
                }),
            ];
            var result = (0, updateNodes_1.updateNodes)(current, update);
            (0, vitest_1.expect)(result).not.toBe(current);
            (0, vitest_1.expect)((_a = result[0]) === null || _a === void 0 ? void 0 : _a.position).toEqual((_b = update[0]) === null || _b === void 0 ? void 0 : _b.position);
            (0, vitest_1.expect)((_c = result[0]) === null || _c === void 0 ? void 0 : _c.measured).toEqual({ width: 200, height: 100 });
            (0, vitest_1.expect)((_d = result[0]) === null || _d === void 0 ? void 0 : _d.width).toBe(200);
            (0, vitest_1.expect)((_e = result[0]) === null || _e === void 0 ? void 0 : _e.height).toBe(100);
        });
    });
    (0, vitest_1.describe)('property updates', function () {
        (0, vitest_1.it)('updates className property', function () {
            var _a, _b, _c;
            var current = [createNode('node1', { className: 'old-class' })];
            var update = [createNode('node1', { className: 'new-class' })];
            var result = (0, updateNodes_1.updateNodes)(current, update);
            (0, vitest_1.expect)(result).not.toBe(current);
            (0, vitest_1.expect)((_a = result[0]) === null || _a === void 0 ? void 0 : _a.className).toBe('new-class');
            // preserves existing node data
            (0, vitest_1.expect)((_b = result[0]) === null || _b === void 0 ? void 0 : _b.data).toBe((_c = current[0]) === null || _c === void 0 ? void 0 : _c.data);
        });
        (0, vitest_1.it)('updates hidden property', function () {
            var _a, _b, _c;
            var current = [createNode('node1')];
            var update = [createNode('node1', { hidden: true })];
            var result = (0, updateNodes_1.updateNodes)(current, update);
            (0, vitest_1.expect)(result).not.toBe(current);
            (0, vitest_1.expect)((_a = result[0]) === null || _a === void 0 ? void 0 : _a.hidden).toBe(true);
            // preserves existing node data
            (0, vitest_1.expect)((_b = result[0]) === null || _b === void 0 ? void 0 : _b.data).toBe((_c = current[0]) === null || _c === void 0 ? void 0 : _c.data);
        });
        (0, vitest_1.it)('updates selected property', function () {
            var _a, _b, _c;
            var current = [createNode('node1')];
            var update = [createNode('node1', { selected: true })];
            var result = (0, updateNodes_1.updateNodes)(current, update);
            (0, vitest_1.expect)(result).not.toBe(current);
            (0, vitest_1.expect)((_a = result[0]) === null || _a === void 0 ? void 0 : _a.selected).toBe(true);
            // preserves existing node data
            (0, vitest_1.expect)((_b = result[0]) === null || _b === void 0 ? void 0 : _b.data).toBe((_c = current[0]) === null || _c === void 0 ? void 0 : _c.data);
        });
        (0, vitest_1.it)('updates selectable property', function () {
            var _a, _b, _c;
            var current = [createNode('node1', { selectable: true })];
            var update = [createNode('node1', { selectable: false })];
            var result = (0, updateNodes_1.updateNodes)(current, update);
            (0, vitest_1.expect)(result).not.toBe(current);
            (0, vitest_1.expect)((_a = result[0]) === null || _a === void 0 ? void 0 : _a.selectable).toBe(false);
            // preserves existing node data
            (0, vitest_1.expect)((_b = result[0]) === null || _b === void 0 ? void 0 : _b.data).toBe((_c = current[0]) === null || _c === void 0 ? void 0 : _c.data);
        });
        (0, vitest_1.it)('updates style property', function () {
            var _a, _b, _c;
            var current = [createNode('node1')];
            var update = [createNode('node1', { style: { color: 'red' } })];
            var result = (0, updateNodes_1.updateNodes)(current, update);
            (0, vitest_1.expect)(result).not.toBe(current);
            (0, vitest_1.expect)((_a = result[0]) === null || _a === void 0 ? void 0 : _a.style).toEqual({ color: 'red' });
            // preserves existing node data
            (0, vitest_1.expect)((_b = result[0]) === null || _b === void 0 ? void 0 : _b.data).toBe((_c = current[0]) === null || _c === void 0 ? void 0 : _c.data);
        });
        (0, vitest_1.it)('updates zIndex property', function () {
            var _a, _b, _c;
            var current = [createNode('node1', { zIndex: 1 })];
            var update = [createNode('node1', { zIndex: 10 })];
            var result = (0, updateNodes_1.updateNodes)(current, update);
            (0, vitest_1.expect)(result).not.toBe(current);
            (0, vitest_1.expect)((_a = result[0]) === null || _a === void 0 ? void 0 : _a.zIndex).toBe(10);
            // preserves existing node data
            (0, vitest_1.expect)((_b = result[0]) === null || _b === void 0 ? void 0 : _b.data).toBe((_c = current[0]) === null || _c === void 0 ? void 0 : _c.data);
        });
        (0, vitest_1.it)('updates handles', function () {
            var _a;
            var handles = {
                current: [{ id: 'handle1', type: 'source', position: system_1.Position.Left }],
                update: [{ id: 'handle1', type: 'source', position: system_1.Position.Right }],
            };
            var current = [createNode('node1', { handles: handles.current })];
            var update = [createNode('node1', { handles: handles.update })];
            var result = (0, updateNodes_1.updateNodes)(current, update);
            (0, vitest_1.expect)(result).not.toBe(current);
            (0, vitest_1.expect)((_a = result[0]) === null || _a === void 0 ? void 0 : _a.handles).toBe(handles.update);
        });
        (0, vitest_1.it)('preserves node when handles are equal', function () {
            var _a, _b;
            var handles = [{ id: 'handle1', type: 'source', position: system_1.Position.Left }];
            var current = [createNode('node1', { handles: handles })];
            var update = [createNode('node1', { handles: structuredClone(handles) })];
            // just to be sure that objects are different
            (0, vitest_1.expect)((_a = update[0]) === null || _a === void 0 ? void 0 : _a.handles).not.toBe((_b = current[0]) === null || _b === void 0 ? void 0 : _b.handles);
            var result = (0, updateNodes_1.updateNodes)(current, update);
            (0, vitest_1.expect)(result).toBe(current);
            (0, vitest_1.expect)(result[0]).toBe(current[0]);
        });
        (0, vitest_1.it)('preserves handles when equal, but node has changes', function () {
            var _a, _b, _c, _d, _e, _f, _g;
            var handles = [{ id: 'handle1', type: 'source', position: system_1.Position.Left }];
            var current = [createNode('node1', { handles: handles })];
            var update = [createNode('node1', { handles: structuredClone(handles), selected: true })];
            // just to be sure that
            (0, vitest_1.expect)((_a = update[0]) === null || _a === void 0 ? void 0 : _a.handles).not.toBe((_b = current[0]) === null || _b === void 0 ? void 0 : _b.handles);
            var result = (0, updateNodes_1.updateNodes)(current, update);
            (0, vitest_1.expect)(result).not.toBe(current);
            (0, vitest_1.expect)(result[0]).not.toBe(current[0]);
            (0, vitest_1.expect)(result[0]).not.toBe(update[0]);
            (0, vitest_1.expect)((_c = result[0]) === null || _c === void 0 ? void 0 : _c.handles).toBe((_d = current[0]) === null || _d === void 0 ? void 0 : _d.handles);
            (0, vitest_1.expect)((_e = result[0]) === null || _e === void 0 ? void 0 : _e.selected).toBe(true);
            // Width and height are now forced in the implementation
            (0, vitest_1.expect)((_f = result[0]) === null || _f === void 0 ? void 0 : _f.width).toBe(100);
            (0, vitest_1.expect)((_g = result[0]) === null || _g === void 0 ? void 0 : _g.height).toBe(50);
        });
    });
    (0, vitest_1.describe)('multiple node updates', function () {
        (0, vitest_1.it)('updates only changed nodes', function () {
            var _a;
            var current = [
                createNode('node1'),
                createNode('node2'),
                createNode('node3'),
            ];
            var update = [
                createNode('node1'), // no change
                createNode('node2', { position: { x: 100, y: 50 } }), // position changed
                createNode('node3'), // no change
            ];
            var result = (0, updateNodes_1.updateNodes)(current, update);
            (0, vitest_1.expect)(result).not.toBe(current);
            (0, vitest_1.expect)(result[0]).toBe(current[0]);
            (0, vitest_1.expect)(result[1]).not.toBe(current[1]);
            (0, vitest_1.expect)((_a = result[1]) === null || _a === void 0 ? void 0 : _a.position).toEqual({ x: 100, y: 50 });
            (0, vitest_1.expect)(result[2]).toBe(current[2]);
        });
        (0, vitest_1.it)('handles node reordering', function () {
            var current = [
                createNode('node1'),
                createNode('node2'),
            ];
            var update = [
                createNode('node2'),
                createNode('node1'),
            ];
            var result = (0, updateNodes_1.updateNodes)(current, update);
            (0, vitest_1.expect)(result).not.toBe(current);
            (0, vitest_1.expect)(result[0]).toBe(current[1]);
            (0, vitest_1.expect)(result[1]).toBe(current[0]);
        });
        (0, vitest_1.it)('handles complex changes', function () {
            var _a, _b;
            var current = [
                createNode('node1', { position: { x: 0, y: 0 } }),
                createNode('node2', { position: { x: 100, y: 0 } }),
                createNode('node3', { position: { x: 200, y: 0 } }),
            ];
            var update = [
                createNode('node1', { position: { x: 0, y: 0 } }), // no change
                createNode('node2', { position: { x: 150, y: 50 } }), // position changed
                // node3 removed
                createNode('node4', { position: { x: 300, y: 0 } }), // new node
            ];
            var result = (0, updateNodes_1.updateNodes)(current, update);
            (0, vitest_1.expect)(result).not.toBe(current);
            (0, vitest_1.expect)(result).toHaveLength(3);
            (0, vitest_1.expect)(result[0]).toBe(current[0]);
            (0, vitest_1.expect)((_a = result[1]) === null || _a === void 0 ? void 0 : _a.position).toEqual({ x: 150, y: 50 });
            (0, vitest_1.expect)((_b = result[2]) === null || _b === void 0 ? void 0 : _b.id).toBe('node4');
        });
    });
    (0, vitest_1.describe)('edge cases', function () {
        (0, vitest_1.it)('handles empty arrays', function () {
            var result = (0, updateNodes_1.updateNodes)([], []);
            (0, vitest_1.expect)(result).toEqual([]);
        });
        (0, vitest_1.it)('handles empty current with new nodes', function () {
            var update = [createNode('node1')];
            var result = (0, updateNodes_1.updateNodes)([], update);
            (0, vitest_1.expect)(result).toHaveLength(1);
            (0, vitest_1.expect)(result[0]).toBe(update[0]);
        });
        (0, vitest_1.it)('handles empty update with existing nodes', function () {
            var current = [createNode('node1')];
            var result = (0, updateNodes_1.updateNodes)(current, []);
            (0, vitest_1.expect)(result).not.toBe(current);
            (0, vitest_1.expect)(result).toHaveLength(0);
        });
        (0, vitest_1.it)('preserves other node properties not explicitly checked', function () {
            var current = [
                createNode('node1', {
                    connectable: false,
                    deletable: true,
                }),
            ];
            var update = [createNode('node1', {
                    connectable: true,
                    deletable: false,
                })];
            var result = (0, updateNodes_1.updateNodes)(current, update);
            (0, vitest_1.expect)(result).toBe(current);
            (0, vitest_1.expect)(result[0]).toBe(current[0]);
        });
    });
});
