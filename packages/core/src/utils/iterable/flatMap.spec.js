import { describe, expect, it } from 'vitest';
import { iflatMap } from './flatMap';
describe('iflatMap', () => {
    it('maps and flattens in data-first style', () => {
        const input = [1, 2, 3];
        const mapper = (n) => [n, n * 2];
        const result = [...iflatMap(input, mapper)];
        expect(result).toEqual([1, 2, 2, 4, 3, 6]);
    });
    it('maps and flattens in composition style', () => {
        const input = ['a', 'b'];
        const mapper = (s) => [`${s}1`, `${s}2`];
        const result = [...iflatMap(mapper)(input)];
        expect(result).toEqual(['a1', 'a2', 'b1', 'b2']);
    });
    it('handles empty iterables', () => {
        const result = [...iflatMap([], (x) => [x, x])];
        expect(result).toEqual([]);
    });
    it('works with Set and generator output', () => {
        const input = new Set([1, 2]);
        const mapper = function* (n) {
            yield n;
            yield n + 10;
        };
        const result = [...iflatMap(input, mapper)];
        expect(result).toEqual([1, 11, 2, 12]);
    });
    it('throws if mapper is not a function', () => {
        // @ts-expect-error
        expect(() => iflatMap([], null)).toThrow();
    });
});
