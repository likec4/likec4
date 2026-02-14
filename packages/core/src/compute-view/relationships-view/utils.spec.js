import { prop } from 'remeda';
import { describe, it } from 'vitest';
import { Builder } from '../../builder/Builder';
import { treeFromElements } from './utils';
describe('treeFromElements', () => {
    const specs = Builder
        .specification({
        elements: {
            el: {},
        },
    });
    const builder = specs
        .model(({ el }, m) => m(el('system'), el('system.subsystem1'), el('system.subsystem1.component1'), el('system.subsystem1.component2'), el('system.subsystem2'), el('standalone')));
    it('sorts elements with parents first', ({ expect }) => {
        const tree = treeFromElements(builder.toLikeC4Model().elements());
        // Verify parents come before children in the sorted array
        const ids = tree.sorted.map(e => e._literalId);
        expect(ids.indexOf('system')).toBeLessThan(ids.indexOf('system.subsystem1'));
        expect(ids.indexOf('system.subsystem1')).toBeLessThan(ids.indexOf('system.subsystem1.component1'));
    });
    it('identifies root elements correctly', ({ expect }) => {
        const tree = treeFromElements(builder.toLikeC4Model().elements());
        // Only system and standalone should be roots
        expect(tree.root.size).toBe(2);
        const rootIds = Array.from(tree.root).map(e => e._literalId);
        expect(rootIds).toContain('system');
        expect(rootIds).toContain('standalone');
        expect(rootIds).not.toContain('system.subsystem1');
    });
    it('byId retrieves correct elements', ({ expect }) => {
        const tree = treeFromElements(builder.toLikeC4Model().elements());
        expect(tree.byId('system.subsystem1').id).toBe('system.subsystem1');
        expect(() => tree.byId('nonexistent')).toThrow('Element not found by id: nonexistent');
    });
    it('parent returns correct parent element', ({ expect }) => {
        const tree = treeFromElements(builder.toLikeC4Model().elements());
        const ars = 'system.subsystem1';
        const subsystem1 = tree.byId(ars);
        const component1 = tree.byId('system.subsystem1.component1');
        expect(tree.parent(component1)).toBe(subsystem1);
        expect(tree.parent(tree.byId('system'))).toBeNull();
        expect(tree.parent(tree.byId('standalone'))).toBeNull();
    });
    it('children returns direct children only', ({ expect }) => {
        const tree = treeFromElements(builder.toLikeC4Model().elements());
        const system = tree.byId('system');
        const systemChildren = tree.children(system);
        // system should have subsystem1 and subsystem2 as direct children
        expect(systemChildren.length).toBe(2);
        expect(systemChildren.map(e => e.id)).toContain('system.subsystem1');
        expect(systemChildren.map(e => e.id)).toContain('system.subsystem2');
        // should not contain deeper descendants
        expect(systemChildren.map(e => e.id)).not.toContain('system.subsystem1.component1');
    });
    it('handles empty input', ({ expect }) => {
        const tree = treeFromElements([]);
        expect(tree.sorted).toEqual([]);
        expect(tree.root.size).toBe(0);
        expect(() => tree.byId('anything')).toThrow();
    });
    it('handles only roots', ({ expect }) => {
        const result1 = treeFromElements(specs
            .model(({ el }, _) => _(el('customer'), el('cloud'), el('cloud.api'), el('amazon')))
            .toLikeC4Model()
            .elements()).flatten();
        expect([...result1].map(prop('id'))).toEqual([
            'customer',
            'cloud',
            'amazon',
            'cloud.api',
        ]);
    });
    it('correctly flattens hierarchy', ({ expect }) => {
        const result1 = treeFromElements(specs
            .model(({ el }, _) => _(el('cloud'), el('cloud.backend'), el('cloud.backend.service1'), el('cloud.backend.service1.api'), el('cloud.backend.service2'), el('amazon')))
            .toLikeC4Model()
            .elements()).flatten();
        expect([...result1].map(prop('id'))).toEqual([
            'cloud',
            'amazon',
            'cloud.backend.service1',
            'cloud.backend.service2',
            'cloud.backend.service1.api',
        ]);
        const result2 = treeFromElements(specs
            .model(({ el, _ }) => _(el('cloud'), el('cloud.backend'), el('cloud.backend.service1'), el('cloud.backend.service1.api'), el('cloud.backend.service2'), el('cloud.backend.service2.api')))
            .toLikeC4Model()
            .elements()).flatten();
        expect([...result2].map(prop('id'))).toEqual([
            'cloud',
            'cloud.backend.service1',
            'cloud.backend.service2',
            'cloud.backend.service1.api',
            'cloud.backend.service2.api',
        ]);
        const result3 = treeFromElements(specs
            .model(({ el, _ }) => _(el('cloud'), el('cloud.backend1'), el('cloud.backend1.service1'), el('cloud.backend1.service1.api'), el('cloud.backend2'), el('cloud.backend2.service2'), el('cloud.backend2.service2.api')))
            .toLikeC4Model()
            .elements()).flatten();
        expect([...result3].map(prop('id'))).toEqual([
            'cloud',
            'cloud.backend1',
            'cloud.backend2',
            'cloud.backend1.service1.api',
            'cloud.backend2.service2.api',
        ]);
        const result4 = treeFromElements(specs
            .model(({ el, _ }) => _(el('cloud'), el('cloud.backend1'), el('cloud.backend1.service1'), el('cloud.backend1.service1.api'), el('cloud.backend2'), el('cloud.backend2.service2'), el('cloud.backend2.service2.api'), el('amazon'), el('amazon.rds'), el('amazon.rds.pg1'), el('amazon.rds.pg2'), el('amazon.rds.pg2.db'), el('amazon.rds.pg2.db.db1'), el('amazon.sqs'), el('amazon.sqs.q1'), el('amazon.sqs.q2')))
            .toLikeC4Model()
            .elements()).flatten();
        expect([...result4].map(prop('id'))).toEqual([
            'cloud',
            'amazon',
            'cloud.backend1',
            'cloud.backend2',
            'cloud.backend1.service1.api',
            'cloud.backend2.service2.api',
            'amazon.rds',
            'amazon.sqs',
            'amazon.rds.pg1',
            'amazon.rds.pg2',
            'amazon.rds.pg2.db.db1',
            'amazon.sqs.q1',
            'amazon.sqs.q2',
        ]);
    });
});
