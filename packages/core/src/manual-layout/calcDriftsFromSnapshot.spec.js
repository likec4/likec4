import { indexBy } from 'remeda';
import { describe, expect, it } from 'vitest';
import { _layout } from '../types';
import { prepareFixtures } from './__test__/fixture';
import { calcDriftsFromSnapshot } from './calcDriftsFromSnapshot';
function testCalcDrifts(patches) {
    const { snapshot, layouted, layoutedNodes, layoutedEdges, } = prepareFixtures(patches);
    const result = calcDriftsFromSnapshot(layouted, snapshot);
    const nodes = indexBy(result.nodes, n => n.id);
    const edges = indexBy(result.edges, e => e.id);
    return {
        result,
        nodes,
        edges,
        snapshot,
        layouted,
    };
}
describe('calcDriftsFromSnapshot', () => {
    it('should return auto layout without drifts when nothing changed', () => {
        const { result } = testCalcDrifts();
        expect(result[_layout]).toBe('auto');
        expect(result.drifts).toBeUndefined();
    });
    describe('nodes', () => {
        it('should detect nodes-added drift', () => {
            const { result, nodes } = testCalcDrifts({
                nodes: {
                    'newnode': {
                        title: 'New Node',
                        x: 100,
                        y: 100,
                    },
                },
            });
            expect(result[_layout]).toBe('auto');
            expect(result.drifts).toEqual(['nodes-added']);
            expect(nodes.newnode.drifts).toEqual(['added']);
        });
        it('should detect nodes-removed drift', () => {
            const { result } = testCalcDrifts({
                nodes: {
                    'customer': null,
                },
            });
            expect(result.drifts).toContain('nodes-removed');
        });
        it('should propagate node drifts to view', () => {
            const { result, nodes } = testCalcDrifts({
                nodes: {
                    'customer': d => {
                        d.shape = 'cylinder';
                        d.width += 20;
                        d.height += 20;
                    },
                },
            });
            expect(nodes.customer.drifts).toEqual(['shape-changed']);
            expect(result.drifts).toEqual(['nodes-drift']);
        });
        it('should not have drifts when changes are auto-applied', () => {
            const { result, nodes } = testCalcDrifts({
                nodes: {
                    'customer': {
                        color: 'secondary',
                        kind: 'system',
                        tags: ['tag-3'],
                    },
                },
            });
            expect(result.drifts).toBeUndefined();
            expect(nodes.customer.drifts).toBeUndefined();
            expect(nodes.customer.color).toBe('secondary');
            expect(nodes.customer.kind).toBe('system');
        });
    });
    describe('edges', () => {
        it('should detect edges-added drift', () => {
            const { result, edges } = testCalcDrifts({
                nodes: {
                    newnode: {},
                },
                edges: {
                    'edge3': {
                        source: 'customer',
                        target: 'newnode',
                    },
                },
            });
            expect(result.drifts).toContain('edges-added');
            expect(edges.edge3.drifts).toEqual(['added']);
        });
        it('should detect edges-removed drift', () => {
            const { result } = testCalcDrifts({
                edges: {
                    edge2: undefined,
                },
            });
            expect(result.edges).toHaveLength(1);
            expect(result.drifts).toEqual(['edges-removed']);
        });
        it('should match edges by source and target if id changed', () => {
            const { result } = testCalcDrifts({
                edges: {
                    edge2: {
                        id: 'edge2: modified id',
                    },
                },
            });
            // Should not detect edges-added/removed since source/target match
            expect(result.drifts).toBeUndefined();
        });
    });
    it('should combine multiple drift types', () => {
        const { result, nodes } = testCalcDrifts({
            nodes: {
                'customer': d => {
                    d.title = 'Customer Updated with a very long title that increases size significantly';
                    d.width = 500;
                    d.height = 300;
                },
                newnode: {
                    title: 'New Node',
                    x: 100,
                    y: 100,
                },
                'saas.frontend': null,
            },
        });
        expect(result.drifts).toContain('nodes-added');
        expect(result.drifts).toContain('nodes-removed');
        expect(result.drifts).toContain('nodes-drift');
        expect(nodes.customer.drifts).toEqual(['label-changed']);
        expect(nodes.newnode.drifts).toEqual(['added']);
    });
    it('should handle type-changed drift', () => {
        const { snapshot, layouted } = prepareFixtures({
            view: {
                // Change view type from 'element' to 'deployment'
                _type: 'deployment',
            },
        });
        const result = calcDriftsFromSnapshot(layouted, snapshot);
        expect(result.drifts).toContain('type-changed');
    });
});
