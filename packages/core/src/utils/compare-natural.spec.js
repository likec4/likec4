import { sort as remedaSort } from 'remeda';
import { describe, expect, it } from 'vitest';
import { compareNatural, compareNaturalHierarchically } from './compare-natural';
describe('compareNatural', () => {
    const sort = (array) => remedaSort(array, compareNatural);
    it('should move undefined to the end', () => {
        expect(sort([
            undefined,
            'apple',
            undefined,
            'banana',
        ])).toEqual([
            'apple',
            'banana',
            undefined,
            undefined,
        ]);
    });
    it('should sort array of strings', () => {
        expect(sort([
            'apple1',
            'apple11',
            'apple2',
            'apple10',
        ])).toEqual([
            'apple1',
            'apple2',
            'apple10',
            'apple11',
        ]);
    });
});
describe('compareNaturalHierarchically', () => {
    const sortHierarchically = (array, separator = '.') => remedaSort(array, compareNaturalHierarchically(separator));
    it('should sort strings hierarchically', () => {
        expect(sortHierarchically([
            'a.b.c',
            'a',
            'a.b',
            'a.c.c',
        ])).toEqual([
            'a',
            'a.b',
            'a.b.c',
            'a.c.c',
        ]);
        expect(sortHierarchically([
            'b.c',
            'b',
            'a.b.c',
        ])).toEqual([
            'a.b.c',
            'b',
            'b.c',
        ]);
        expect(sortHierarchically([
            '_._.b.c',
            '_._.b',
            '_._.a.c',
            '_._.a.b.1.2',
            '_._.a.b.1',
        ])).toEqual([
            '_._.a.b.1',
            '_._.a.b.1.2',
            '_._.a.c',
            '_._.b',
            '_._.b.c',
        ]);
    });
    it('should handle custom separators', () => {
        expect(sortHierarchically([
            'a/b/c',
            'a',
            'a/b',
            'a/c/c',
        ], '/')).toEqual([
            'a',
            'a/b',
            'a/b/c',
            'a/c/c',
        ]);
    });
    it('should handle mixed depths', () => {
        expect(sortHierarchically([
            'b',
            'a.b',
            'a',
            'a.b.c',
            'a.a',
        ])).toEqual([
            'a',
            'a.a',
            'a.b',
            'a.b.c',
            'b',
        ]);
    });
    it('should sort numerically within hierarchies', () => {
        expect(sortHierarchically([
            'a.b.2',
            'a.b.10',
            'a.b.1',
        ])).toEqual([
            'a.b.1',
            'a.b.2',
            'a.b.10',
        ]);
    });
    it('should handle empty strings', () => {
        expect(sortHierarchically([
            'a.b',
            '',
            'a',
            'b',
        ])).toEqual([
            '',
            'a',
            'a.b',
            'b',
        ]);
    });
    it('should handle undefined values', () => {
        expect(sortHierarchically([
            'a.b',
            undefined,
            'a',
            'b',
            undefined,
        ])).toEqual([
            'a',
            'a.b',
            'b',
            undefined,
            undefined,
        ]);
    });
    it('should handle equal strings', () => {
        expect(sortHierarchically([
            'a',
            'a',
            'a',
        ])).toEqual([
            'a',
            'a',
            'a',
        ]);
    });
    it('should sort deeper paths first when deepestFirst=true', () => {
        const sortDeepFirst = (array, separator = '.') => remedaSort(array, compareNaturalHierarchically(separator, true));
        expect(sortDeepFirst([
            'a',
            'a.b',
            'a.b.c',
            'a.a',
        ])).toEqual([
            'a.a',
            'a.b.c',
            'a.b',
            'a',
        ]);
        // Ensure deeper comes first within same prefix and preserves natural order for differing segments
        expect(sortDeepFirst([
            'x.2',
            'x.10',
            'x',
            'x.1',
        ])).toEqual([
            'x.1',
            'x.2',
            'x.10',
            'x',
        ]);
    });
    it('should sort deeper paths first with a custom separator', () => {
        const sortDeepFirst = (array, separator = '/') => remedaSort(array, compareNaturalHierarchically(separator, true));
        expect(sortDeepFirst([
            'a/b/c',
            'a',
            'a/b',
            'a/a',
        ])).toEqual([
            'a/a',
            'a/b/c',
            'a/b',
            'a',
        ]);
    });
});
