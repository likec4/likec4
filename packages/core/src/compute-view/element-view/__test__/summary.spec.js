import { describe, expect, it } from 'vitest';
import { Builder } from '../../../builder';
import { TestHelper } from '../__test__/TestHelper';
describe('Summary field', () => {
    const builder = Builder
        .specification({
        elements: {
            el: {},
            specWithDesc: {
                description: { txt: 'description from spec' },
            },
        },
    });
    const { model, el, specWithDesc } = builder.helpers().model;
    const { $include } = TestHelper;
    it('computed from summary field if defined', () => {
        const t = TestHelper.from(builder.clone().with(model(el('el1', {
            summary: 'el1 valid',
            description: 'invalid',
        }))));
        const { nodes: [node] } = t.computeView($include('el1'));
        expect(node).toMatchObject({
            description: {
                txt: 'el1 valid',
            },
        });
        expect(node).not.toHaveProperty('summary');
    });
    it('computed from description field if summary is not defined', () => {
        const t = TestHelper.from(builder.clone().with(model(el('el2', {
            description: 'el2 valid',
        }))));
        const { nodes: [node] } = t.computeView($include('el2'));
        expect(node).toMatchObject({
            description: {
                txt: 'el2 valid',
            },
        });
    });
    it('empty string if both summary and description are not defined', () => {
        const t = TestHelper.from(builder.clone().with(model(el('el3'))));
        const { nodes: [node] } = t.computeView($include('el3'));
        expect(node).not.toHaveProperty('summary');
        expect(node).not.toHaveProperty('description');
    });
    it('computed from description field defined in spec', () => {
        const t = TestHelper.from(builder.clone().with(model(specWithDesc('some'))));
        const { nodes: [node] } = t.computeView($include('some'));
        expect(node).toMatchObject({
            description: {
                txt: 'description from spec',
            },
        });
    });
});
