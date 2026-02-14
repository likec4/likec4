import { prop } from 'remeda';
import { describe, it } from 'vitest';
import { Builder } from '../../builder/Builder';
import { computeRelationshipsView as computeRelationships } from './compute';
describe('computeRelationshipsView', () => {
    const specs = Builder
        .specification({
        elements: {
            el: {},
        },
    });
    const builder = specs
        .model(({ el }, _) => _(el('cloud').with(el('backend').with(el('graphql')), el('frontend')), el('amazon')));
    it('collects subject and direct relationships', ({ expect }) => {
        const result = computeRelationships('cloud.backend', builder
            .model(({ rel }, _) => _(rel('cloud.backend', 'amazon')))
            .toLikeC4Model(), null);
        expect(result.subjects.size).toBe(1);
        expect([...result.subjects].map(s => s.id)).toContain('cloud.backend');
        expect(result.incoming.size).toBe(0);
        expect(result.incomers.size).toBe(0);
        expect(result.outgoing.size).toBe(1);
        expect([...result.outgoing].map(r => r.expression)).toContain('cloud.backend -> amazon');
        expect(result.outgoers.size).toBe(1);
        expect([...result.outgoers].map(e => e.id)).toContain('amazon');
    });
    it('includes child relationships in the subject view', ({ expect }) => {
        const m = builder
            .model(({ _, rel }) => _(rel('cloud.frontend', 'cloud.backend.graphql'), rel('amazon', 'cloud.backend.graphql'), rel('cloud.backend.graphql', 'amazon')))
            .toLikeC4Model(), result = computeRelationships('cloud.backend', m, null);
        expect(result.subjects.size).toBe(2);
        expect([...result.subjects]).toEqual([
            m.element('cloud.backend'),
            m.element('cloud.backend.graphql'),
        ]);
        expect(result.incoming.size).toBe(2);
        expect([...result.incoming].map(r => r.expression)).toEqual([
            'cloud.frontend -> cloud.backend.graphql',
            'amazon -> cloud.backend.graphql',
        ]);
        expect(result.incomers.size).toBe(2);
        expect([...result.incomers]).toEqual([
            m.element('cloud.frontend'),
            m.element('amazon'),
        ]);
        expect(result.outgoing.size).toBe(1);
        expect([...result.outgoing].map(r => r.expression)).toEqual([
            'cloud.backend.graphql -> amazon',
        ]);
        expect(result.outgoers.size).toBe(1);
        expect([...result.outgoers]).toEqual([
            m.element('amazon'),
        ]);
    });
    it('includes siblings in incomers when a deeper element has a relationship', ({ expect }) => {
        const m = builder
            .model(({ _, el, rel }) => _(el('external').with(el('some'), el('some.service')), rel('external.some.service', 'cloud.backend')))
            .toLikeC4Model(), result = computeRelationships('cloud', m, null);
        expect(result.incomers.size).toBe(2);
        expect([...result.incomers]).toEqual([
            m.element('external'),
            // Must skip the external.some
            m.element('external.some.service'),
        ]);
        expect([...result.subjects]).toEqual([
            m.element('cloud'),
            m.element('cloud.backend'),
        ]);
        expect(result.outgoers.size).toBe(0);
    });
    it('includes siblings in outgoers when a deeper element has a relationship', ({ expect }) => {
        const m = builder
            .model(({ _, el, rel }) => _(el('external').with(el('some').with(el('service'))), rel('cloud.frontend', 'external.some.service')))
            .toLikeC4Model(), result = computeRelationships('cloud', m, null);
        m.findElement('clour');
        expect(result.outgoers.size).toBe(2);
        expect([...result.outgoers].map(e => e.id)).toEqual([
            'external',
            'external.some.service',
        ]);
        expect(result.subjects.size).toBe(2);
        expect([...result.subjects].map(e => e.id)).toEqual([
            'cloud',
            'cloud.frontend',
        ]);
        expect(result.incomers.size).toBe(0);
    });
    it('correctly handles internal relationships', ({ expect }) => {
        const m = specs
            .model(({ el, rel }, _) => _(el('cloud').with(el('backend').with(el('api')), el('frontend').with(el('ui'))), rel('cloud.frontend.ui', 'cloud.backend.api')))
            .toLikeC4Model();
        const result1 = computeRelationships('cloud', m, null);
        expect(result1).toEqual({
            incomers: new Set(),
            incoming: new Set(),
            subjects: new Set([m.element('cloud')]),
            outgoers: new Set(),
            outgoing: new Set(),
        });
    });
    it('correctly flattens subjects', ({ expect }) => {
        const result1 = computeRelationships('cloud', specs
            .model(({ el, rel }, _) => _(el('cloud'), el('cloud.backend'), el('cloud.backend.service1'), el('cloud.backend.service1.api'), el('cloud.backend.service2'), el('amazon'), rel('cloud.backend.service1.api', 'amazon'), rel('cloud.backend.service2', 'amazon')))
            .toLikeC4Model(), null);
        expect([...result1.subjects].map(prop('id'))).toEqual([
            'cloud',
            'cloud.backend.service1',
            'cloud.backend.service2',
            'cloud.backend.service1.api',
        ]);
        const result2 = computeRelationships('cloud', specs
            .model(({ el, rel }, _) => _(el('cloud'), el('cloud.backend'), el('cloud.backend.service1'), el('cloud.backend.service1.api'), el('cloud.backend.service2'), el('cloud.backend.service2.api'), el('amazon'), rel('cloud.backend.service1.api', 'amazon'), rel('cloud.backend.service2.api', 'amazon')))
            .toLikeC4Model(), null);
        expect([...result2.subjects].map(prop('id'))).toEqual([
            'cloud',
            'cloud.backend.service1',
            'cloud.backend.service2',
            'cloud.backend.service1.api',
            'cloud.backend.service2.api',
        ]);
        const result3 = computeRelationships('cloud', specs
            .model(({ el, rel }, _) => _(el('cloud'), el('cloud.backend1'), el('cloud.backend1.service1'), el('cloud.backend1.service1.api'), el('cloud.backend2'), el('cloud.backend2.service2'), el('cloud.backend2.service2.api'), el('amazon'), rel('cloud.backend1.service1.api', 'amazon'), rel('cloud.backend2.service2.api', 'amazon')))
            .toLikeC4Model(), null);
        expect([...result3.subjects].map(prop('id'))).toEqual([
            'cloud',
            'cloud.backend1',
            'cloud.backend2',
            'cloud.backend1.service1.api',
            'cloud.backend2.service2.api',
        ]);
        const result4 = computeRelationships('cloud', specs
            .model(({ el, rel }, _) => _(el('cloud'), el('cloud.backend'), el('cloud.backend.service1'), el('cloud.backend.service1.api'), el('amazon'), rel('cloud.backend', 'amazon'), rel('cloud.backend.service1.api', 'amazon')))
            .toLikeC4Model(), null);
        expect([...result4.subjects].map(prop('id'))).toEqual([
            'cloud',
            'cloud.backend',
            'cloud.backend.service1.api',
        ]);
    });
    it('correctly flattens incomers', ({ expect }) => {
        const result1 = computeRelationships('amazon', specs
            .model(({ el, rel }, _) => _(el('cloud'), el('cloud.backend'), el('cloud.backend.service1'), el('cloud.backend.service1.api'), el('cloud.backend.service2'), el('amazon'), rel('cloud.backend.service1.api', 'amazon'), rel('cloud.backend.service2', 'amazon')))
            .toLikeC4Model(), null);
        expect([...result1.incomers].map(prop('id'))).toEqual([
            'cloud',
            'cloud.backend.service1',
            'cloud.backend.service2',
            'cloud.backend.service1.api',
        ]);
        const result2 = computeRelationships('amazon', specs
            .model(({ el, rel }, _) => _(el('cloud'), el('cloud.backend'), el('cloud.backend.service1'), el('cloud.backend.service1.api'), el('amazon'), rel('cloud.backend', 'amazon'), rel('cloud.backend.service1.api', 'amazon')))
            .toLikeC4Model(), null);
        expect([...result2.incomers].map(prop('id'))).toEqual([
            'cloud',
            'cloud.backend',
            'cloud.backend.service1.api',
        ]);
        const result3 = computeRelationships('amazon', specs
            .model(({ el, rel }, _) => _(el('cloud'), el('cloud.backend1'), el('cloud.backend1.service1'), el('cloud.backend1.service1.api'), el('cloud.backend2'), el('cloud.backend2.service2'), el('cloud.backend2.service2.api'), el('amazon'), rel('cloud.backend1.service1.api', 'amazon'), rel('cloud.backend2.service2.api', 'amazon')))
            .toLikeC4Model(), null);
        expect([...result3.incomers].map(prop('id'))).toEqual([
            'cloud',
            'cloud.backend1',
            'cloud.backend2',
            'cloud.backend1.service1.api',
            'cloud.backend2.service2.api',
        ]);
    });
    it('correctly flattens outgoers', ({ expect }) => {
        const result1 = computeRelationships('amazon', specs
            .model(({ el, rel }, _) => _(el('cloud'), el('cloud.backend'), el('cloud.backend.service1'), el('cloud.backend.service1.api'), el('cloud.backend.service2'), el('amazon'), rel('amazon', 'cloud.backend.service1.api'), rel('amazon', 'cloud.backend.service2')))
            .toLikeC4Model(), null);
        expect([...result1.outgoers].map(prop('id'))).toEqual([
            'cloud',
            'cloud.backend.service1',
            'cloud.backend.service2',
            'cloud.backend.service1.api',
        ]);
        const result2 = computeRelationships('amazon', specs
            .model(({ el, rel }, _) => _(el('cloud'), el('cloud.backend'), el('cloud.backend.service1'), el('cloud.backend.service1.api'), el('amazon'), rel('amazon', 'cloud.backend'), rel('amazon', 'cloud.backend.service1.api')))
            .toLikeC4Model(), null);
        expect([...result2.outgoers].map(prop('id'))).toEqual([
            'cloud',
            'cloud.backend',
            'cloud.backend.service1.api',
        ]);
        const result3 = computeRelationships('amazon', specs
            .model(({ el, rel }, _) => _(el('cloud'), el('cloud.backend1'), el('cloud.backend1.service1'), el('cloud.backend1.service1.api'), el('cloud.backend2'), el('cloud.backend2.service2'), el('cloud.backend2.service2.api'), el('amazon'), rel('amazon', 'cloud.backend1.service1.api'), rel('amazon', 'cloud.backend2.service2.api')))
            .toLikeC4Model(), null);
        expect([...result3.outgoers].map(prop('id'))).toEqual([
            'cloud',
            'cloud.backend1',
            'cloud.backend2',
            'cloud.backend1.service1.api',
            'cloud.backend2.service2.api',
        ]);
    });
});
