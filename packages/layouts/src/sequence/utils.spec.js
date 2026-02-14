import { describe, expect, it } from 'vitest';
import { buildCompounds } from './utils';
// Helpers
const node = (id, parent = null) => ({
    id,
    parent,
});
describe('buildCompounds', () => {
    it('should return empty when actors list equals nodes list (no compounds)', () => {
        const a = node('a');
        const b = node('b');
        const actors = [a, b];
        const nodes = [a, b];
        const compounds = buildCompounds(actors, nodes);
        expect(compounds).toEqual([]);
    });
    it('should create a single-level compound for actors sharing the same parent', () => {
        // hierarchy: p -> a1, a2
        const p1 = node('p1');
        const a1 = node('p1.a1', 'p1');
        const a2 = node('p1.a2', 'p1');
        const p2 = node('p2');
        const a3 = node('p2.a3', 'p2');
        const nodes = [p1, p2, a1, a2, a3];
        const actors = [a1, a2, a3];
        const compounds = buildCompounds(actors, nodes);
        expect(compounds).toEqual([
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
    it('should detect "holes" in the sequence', () => {
        // hierarchy: p -> a1, a2
        // Sequence: a1, a2
        const p1 = node('p');
        const a1 = node('a1');
        const a2 = node('p.a2', 'p');
        const a3 = node('a3');
        const a4 = node('p.a4', 'p');
        const nodes = [p1, a1, a2, a3, a4];
        const actors = [a1, a2, a3, a4];
        const compounds = buildCompounds(actors, nodes);
        expect(compounds).toEqual([
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
    it('should create nested compounds for multi-level ancestry', () => {
        // hierarchy: p -> c -> a1, a2
        const p = node('p');
        const c = node('p.c', 'p');
        const a1 = node('p.c.a1', 'p.c');
        const a2 = node('p.c.a2', 'p.c');
        const nodes = [p, c, a1, a2];
        const actors = [a1, a2];
        const compounds = buildCompounds(actors, nodes);
        expect(compounds).toEqual([
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
    it('should update compound span when actors revisit the same parent later', () => {
        // hierarchy: p -> c1 -> a1, a2; p -> c2 -> b1
        const p = node('p');
        const c1 = node('p.c1', 'p');
        const c2 = node('p.c2', 'p');
        const a1 = node('p.c1.a1', 'p.c1');
        const a2 = node('p.c1.a2', 'p.c1');
        const b1 = node('p.c2.b1', 'p.c2');
        const b2 = node('p.c2.b2', 'p.c2');
        const nodes = [p, c1, c2, a1, a2, b1, b2];
        // Sequence: a1 (c1), b1 (c2), a2 (c1)
        const actors = [a1, b1, b2, a2];
        const compounds = buildCompounds(actors, nodes);
        // Top-level compound is p, spanning from first actor to last actor (a1 -> a2)
        expect(compounds).toHaveLength(1);
        const top = compounds[0];
        expect(top.node.id).toBe('p');
        expect(top.from.id).toBe('p.c1.a1');
        expect(top.to.id).toBe('p.c1.a2');
        // Inside, there should be thre nested compounds for c1,c2,c1 in order of first encounter
        expect(top.nested).toHaveLength(3);
        const firstNested = top.nested[0];
        const secondNested = top.nested[1];
        const thirdNested = top.nested[2];
        // c1 first opens at a1
        expect(firstNested).toEqual({
            node: c1,
            from: a1,
            to: a1,
            nested: [],
        });
        // c2 spans only for b1 occurrence
        expect(secondNested).toEqual({
            node: c2,
            from: b1,
            to: b2,
            nested: [],
        });
        expect(thirdNested).toEqual({
            node: c1,
            from: a2,
            to: a2,
            nested: [],
        });
    });
});
