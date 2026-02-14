import { Builder } from '@likec4/core/builder';
import { computeProjectsView } from '@likec4/core/compute-view';
import { invariant } from '@likec4/core/utils';
import { hasAtLeast } from 'remeda';
import { describe, it } from 'vitest';
import { ProjectsViewPrinter } from './ProjectsViewPrinter';
const builder = Builder
    .specification({
    elements: {
        el: {},
    },
})
    .model(({ el }, _) => _(el('c1'), el('c1.sub')));
function print(models) {
    invariant(hasAtLeast(models, 1), 'at least one model is required');
    const view = computeProjectsView(models);
    return ProjectsViewPrinter.toDot(view);
}
describe('ProjectsViewPrinter', () => {
    it('prints if no relationships', async ({ expect }) => {
        const projectA = builder.toLikeC4Model('projectA');
        const projectB = builder.toLikeC4Model('projectB');
        const result = print([projectA, projectB]);
        await expect(result).toMatchFileSnapshot('__snapshots__/ProjectsViewPrinter-no-relationships.dot');
    });
    it('prints with relationship', async ({ expect }) => {
        const projectA = builder
            .model(({ el, rel }, _) => _(el('some'), el('some.extra'), el('@projectB.c1'), el('@projectB.c1.sub'), rel('c1.sub', '@projectB.c1.sub', {
            title: 'a -> b',
            technology: 'technology',
        }), rel('some.extra', 'c1')))
            .views(({ view, $include }, _) => _(view('index', $include('*'))))
            .toLikeC4Model('projectA');
        const projectB = builder.toLikeC4Model({
            id: 'projectB',
            title: 'ProjectB Title',
        });
        const result = print([projectA, projectB]);
        await expect(result).toMatchFileSnapshot('__snapshots__/ProjectsViewPrinter-with-relationship.dot');
    });
    it('prints with two directions', async ({ expect }) => {
        const projectA = builder
            .model(({ el, rel }, _) => _(el('@projectB.c1'), el('@projectB.c1.sub'), rel('c1.sub', '@projectB.c1.sub', {
            title: 'a -> b',
        })))
            .toLikeC4Model('projectA');
        const projectB = builder
            .model(({ el, rel }, _) => _(el('@projectA.c1'), rel('c1', '@projectA.c1', {
            title: 'b -> a',
            technology: 'technology',
        })))
            .toLikeC4Model('projectB');
        const result = print([projectA, projectB]);
        await expect(result).toMatchFileSnapshot('__snapshots__/ProjectsViewPrinter-two-directions.dot');
    });
});
