import { describe, expect, it } from 'vitest';
import { $expr, $where, $with } from '../element-view/__test__/fixture';
import { elementExprToPredicate } from './elementExpressionToPredicate';
const toPredicate = (expr) => elementExprToPredicate(expr);
function nd(props) {
    return {
        kind: 'element',
        ...props,
    };
}
function test$expr(expr) {
    const predicate = toPredicate($expr(expr));
    return {
        yes(node) {
            expect(predicate(nd(node))).toBe(true);
        },
        no(node) {
            expect(predicate(nd(node))).toBe(false);
        },
    };
}
describe('elementExprToPredicate', () => {
    it('returns a function that always returns true for wildcard expression', ({ expect }) => {
        const predicate = toPredicate($expr('*'));
        expect(predicate({})).toBe(true);
    });
    it('returns a function that checks if the node id matches the expanded element expression', () => {
        const { yes, no } = test$expr('cloud._');
        yes({ id: 'cloud' });
        yes({ id: 'cloud.backend' });
        no({ id: 'cloud.backend.graphql' });
        yes({ id: 'cloud.frontend' });
        no({ id: 'cloud.frontend.supportPanel' });
        no({ id: 'customer' });
    });
    it('returns a function that checks if the node id matches the descedant element expression', () => {
        const { yes, no } = test$expr('cloud.*');
        yes({ id: 'cloud.backend.storage' });
        yes({ id: 'cloud.frontend' });
        no({ id: 'cloud' });
        no({ id: 'customer' });
    });
    it('returns a function that checks if the node id matches the element ref expression', () => {
        const { yes, no } = test$expr('cloud.backend');
        no({ id: 'cloud.backend.graphql' });
        yes({ id: 'cloud.backend' });
        no({ id: 'cloud.frontend' });
        no({ id: 'customer' });
    });
    it('returns a function that checks if the node tag matches WHERE tag == clause', () => {
        const { yes, no } = test$expr($where('*', {
            tag: { eq: 'aws' },
        }));
        no({ id: 'amazon' });
        yes({ id: 'customer', tags: ['aws'] });
    });
    it('returns a function that checks if the node tag matches WHERE tag != clause', () => {
        const { yes, no } = test$expr($where('*', {
            tag: { neq: 'next' },
        }));
        yes({ id: 'amazon' });
        yes({ id: 'amazon.s3', tags: ['aws'] });
        no({ id: 'customer', tags: ['next'] });
    });
    it('returns a function that checks if the node id matches internal condition of WHERE', () => {
        const { yes, no } = test$expr($where('amazon', {
            tag: { eq: 'aws' },
        }));
        yes({ id: 'amazon', tags: ['aws'] });
        no({ id: 'customer', tags: ['aws'] });
    });
    it('returns a function that checks if the node id matches internal condition of custom properties expression', () => {
        const { yes, no } = test$expr($with($where('*', { tag: { eq: 'aws' } })));
        yes({ id: 'amazon', tags: ['aws'] });
        no({ id: 'customer' });
    });
});
