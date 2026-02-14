import { mapToObj } from 'remeda';
import { describe, expect, it } from 'vitest';
import { _type } from '../../types';
import { resolveRulesExtendedViews } from './resolve-extended-views';
function views(...views) {
    return mapToObj(views, view => [view.id, {
            ...view,
            title: view.title ?? null,
            description: view.description ?? null,
            tags: view.tags ?? null,
            links: view.links ?? null,
            rules: view.rules ?? [],
        }]);
}
describe('resolveRulesExtendedViews', () => {
    const viewRule1 = {
        include: [
            {
                wildcard: true,
            },
        ],
    };
    const viewRule2 = {
        exclude: [
            {
                ref: {
                    model: 'cloud',
                },
                selector: 'children',
            },
        ],
    };
    const viewRule3 = {
        targets: [],
        style: {},
    };
    const index = {
        [_type]: 'element',
        id: 'index',
        title: null,
        description: null,
        tags: [],
        links: null,
        rules: [viewRule1],
    };
    const index2 = {
        [_type]: 'element',
        id: 'index2',
        extends: 'index',
        title: null,
        description: null,
        tags: null,
        links: null,
        rules: [viewRule2],
    };
    const index3 = {
        [_type]: 'element',
        id: 'index3',
        extends: 'index2',
        title: null,
        description: null,
        tags: null,
        links: null,
        rules: [viewRule3],
    };
    it('should merge rules', () => {
        const result = resolveRulesExtendedViews(views(index3, index, index2));
        expect(result).toMatchObject({
            index: {
                id: 'index',
                rules: [viewRule1],
            },
            index2: {
                id: 'index2',
                extends: 'index',
                rules: [viewRule1, viewRule2],
            },
            index3: {
                id: 'index3',
                extends: 'index2',
                rules: [viewRule1, viewRule2, viewRule3],
            },
        });
    });
    it('should merge other fields', () => {
        const index = {
            [_type]: 'element',
            id: 'index',
            title: 'Landscape',
            viewOf: 'cloud',
            rules: [viewRule1],
            links: null,
            tags: [],
            description: null,
        };
        const result = resolveRulesExtendedViews(views(index3, index, index2));
        expect(result).toEqual({
            index,
            index2: {
                [_type]: 'element',
                id: 'index2',
                extends: 'index',
                title: 'Landscape',
                viewOf: 'cloud',
                links: null,
                tags: [],
                description: null,
                rules: [viewRule1, viewRule2],
            },
            index3: {
                [_type]: 'element',
                id: 'index3',
                extends: 'index2',
                title: 'Landscape',
                viewOf: 'cloud',
                links: null,
                tags: [],
                description: null,
                rules: [viewRule1, viewRule2, viewRule3],
            },
        });
    });
    it('should skip circular extends', () => {
        // Should be skipped because of circular extends
        const index3 = {
            [_type]: 'element',
            id: 'index3',
            extends: 'index4',
        };
        const index4 = {
            [_type]: 'element',
            id: 'index4',
            extends: 'index3',
        };
        // Should be dropped also, because parent is skipped
        const index5 = {
            [_type]: 'element',
            id: 'index5',
            extends: 'index4',
        };
        const result = resolveRulesExtendedViews(views(index3, index5, index4, index, index2));
        expect(result).toEqual({
            index,
            index2: {
                [_type]: 'element',
                id: 'index2',
                extends: 'index',
                title: null,
                links: null,
                tags: [],
                description: null,
                rules: [viewRule1, viewRule2],
            },
        });
    });
    it('should inherit title, description', () => {
        // Should inherit title and description from the parent view
        const index = {
            [_type]: 'element',
            id: 'index',
            title: 'Root View',
            description: 'This is the root view',
            rules: [],
            links: null,
            tags: [],
        };
        const index2 = {
            [_type]: 'element',
            id: 'index2',
            extends: 'index',
            description: 'This is the index2 view',
            rules: [],
        };
        const index3 = {
            [_type]: 'element',
            id: 'index3',
            extends: 'index2',
            rules: [],
        };
        const result = resolveRulesExtendedViews(views(index3, index2, index));
        expect(result).toEqual({
            index,
            index2: {
                [_type]: 'element',
                id: 'index2',
                extends: 'index',
                title: 'Root View',
                description: 'This is the index2 view',
                rules: [],
                links: null,
                tags: [],
            },
            index3: {
                [_type]: 'element',
                description: 'This is the index2 view',
                extends: 'index2',
                id: 'index3',
                links: null,
                rules: [],
                tags: [],
                title: 'Root View',
            },
        });
    });
    it('should skip with non-existing base', () => {
        const index3 = {
            [_type]: 'element',
            id: 'index3',
            extends: 'oops',
        };
        const result = resolveRulesExtendedViews(views(index3, index, index2));
        expect(result).toEqual({
            index,
            index2: {
                [_type]: 'element',
                id: 'index2',
                extends: 'index',
                title: null,
                links: null,
                tags: [],
                description: null,
                rules: [viewRule1, viewRule2],
            },
        });
    });
});
