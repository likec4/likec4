import { describe, expect, it } from 'vitest';
import { Builder } from '../../builder';
import { computeAdhocView } from './compute';
const builder = Builder
    .specification({
    elements: ['el', 'actor'],
})
    .model(({ actor, el, rel }, _) => _(actor('alice'), actor('bob'), el('sys'), el('sys.sub1'), el('sys.sub2'), rel('alice', 'bob'), rel('alice', 'sys.sub1'), rel('bob', 'sys.sub2')));
describe('computeAdhocView', () => {
    it('should be compute same as element view', () => {
        const model = builder
            .views(({ view, $include }, _) => _(view('index', 'index', $include('*')))).toLikeC4Model();
        const elView = model.view('index').$view;
        expect(elView.nodes).toHaveLength(3);
        const adhocView = computeAdhocView(model, [
            {
                include: [
                    { wildcard: true },
                ],
            },
        ]);
        expect(adhocView.nodes).toEqual(elView.nodes);
        expect(adhocView.edges).toEqual(elView.edges);
    });
    it('should be compute same as element view (2)', () => {
        const model = builder
            .views(({ view, $rules, $include }, _) => _(view('index', $rules($include('alice'), $include('sys._'))))).toLikeC4Model();
        const elView = model.view('index').$view;
        const adhocView = computeAdhocView(model, [
            {
                include: [
                    { ref: { model: 'alice' } },
                    { ref: { model: 'sys' }, selector: 'expanded' },
                ],
            },
        ]);
        expect(adhocView.nodes).toEqual(elView.nodes);
        expect(adhocView.edges).toEqual(elView.edges);
    });
});
