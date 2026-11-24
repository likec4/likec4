import { Builder } from '@likec4/core/builder'
import { computeProjectsView } from '@likec4/core/compute-view'
import type { LikeC4Model } from '@likec4/core/model'
import { invariant } from '@likec4/core/utils'
import { hasAtLeast } from 'remeda'
import { describe, it } from 'vitest'
import { ProjectsViewPrinter } from './ProjectsViewPrinter'

const builder = Builder
  .specification({
    elements: {
      el: {},
    },
  })
  .model(({ el }, _) =>
    _(
      el('c1'),
      el('c1.sub'),
    )
  )

function print(models: LikeC4Model[]) {
  invariant(hasAtLeast(models, 1), 'at least one model is required')
  const view = computeProjectsView(models)
  return ProjectsViewPrinter.toDot(view)
}

describe('ProjectsViewPrinter', () => {
  it('prints if no relationships', async ({ expect }) => {
    const projectA = builder.toLikeC4Model('projectA')
    const projectB = builder.toLikeC4Model('projectB')
    const result = print([projectA, projectB])
    await expect(result).toMatchFileSnapshot('__snapshots__/ProjectsViewPrinter-no-relationships.dot')
  })

  it('prints with relationship', async ({ expect }) => {
    const projectA = builder
      .model(({ el, rel }, _) =>
        _(
          el('some'),
          el('some.extra'),
          el('@projectB.c1'),
          el('@projectB.c1.sub'),
          rel('c1.sub', '@projectB.c1.sub', {
            title: 'a -> b',
            technology: 'technology',
          }),
          rel('some.extra', 'c1'),
        )
      )
      .views(({ view, $include }, _) =>
        _(
          view('index', $include('*')),
        )
      )
      .toLikeC4Model('projectA')

    const projectB = builder.toLikeC4Model({
      id: 'projectB',
      title: 'ProjectB Title',
    })

    const result = print([projectA, projectB])

    await expect(result).toMatchFileSnapshot('__snapshots__/ProjectsViewPrinter-with-relationship.dot')
  })

  it('prints with two directions', async ({ expect }) => {
    const projectA = builder
      .model(({ el, rel }, _) =>
        _(
          el('@projectB.c1'),
          el('@projectB.c1.sub'),
          rel('c1.sub', '@projectB.c1.sub', {
            title: 'a -> b',
          }),
        )
      )
      .toLikeC4Model('projectA')

    const projectB = builder
      .model(({ el, rel }, _) =>
        _(
          el('@projectA.c1'),
          rel('c1', '@projectA.c1', {
            title: 'b -> a',
            technology: 'technology',
          }),
        )
      )
      .toLikeC4Model('projectB')

    const result = print([projectA, projectB])
    await expect(result).toMatchFileSnapshot('__snapshots__/ProjectsViewPrinter-two-directions.dot')
  })

  it('prints nested groups and orthogonal routing', async ({ expect }) => {
    const payments = builder.toLikeC4Model({ id: 'payments', metadata: { domain: 'shop', team: 'checkout' } })
    const catalog = builder.toLikeC4Model({ id: 'catalog', metadata: { domain: 'shop' } })
    const view = computeProjectsView([payments, catalog], {
      groupBy: { key: 'domain', thenBy: { key: 'team' } },
      routing: 'ortho',
    })
    const dot = ProjectsViewPrinter.toDot(view)
    expect(dot).toContain('splines = "ortho"')
    expect(dot).toContain('subgraph "cluster_')
    await expect(dot).toMatchFileSnapshot('__snapshots__/ProjectsViewPrinter-grouped-ortho.dot')
  })

  it('stacks ordered groups as layers on one rank each', async ({ expect }) => {
    const models = [
      builder.toLikeC4Model({ id: 'ledger', metadata: { domain: 'payments' } }),
      builder.toLikeC4Model({ id: 'payouts', metadata: { domain: 'payments' } }),
      builder.toLikeC4Model({ id: 'catalog', metadata: { domain: 'shop' } }),
      builder.toLikeC4Model({ id: 'identity', metadata: { domain: 'platform' } }),
    ]
    invariant(hasAtLeast(models, 1), 'at least one model is required')
    const view = computeProjectsView(models, {
      groupBy: { key: 'domain' },
      order: ['shop', 'payments', 'platform'],
    })
    const dot = ProjectsViewPrinter.toDot(view)
    expect(dot).toContain('newrank = true')
    expect(dot.match(/rank = "same"/g)).toHaveLength(3)
    expect(dot.match(/style = "invis"/g)).toHaveLength(2)
    await expect(dot).toMatchFileSnapshot('__snapshots__/ProjectsViewPrinter-layers.dot')
  })

  it('does not stack layers without an order', ({ expect }) => {
    const models = [
      builder.toLikeC4Model({ id: 'catalog', metadata: { domain: 'shop' } }),
      builder.toLikeC4Model({ id: 'identity', metadata: { domain: 'platform' } }),
    ]
    invariant(hasAtLeast(models, 1), 'at least one model is required')
    const dot = ProjectsViewPrinter.toDot(computeProjectsView(models, { groupBy: { key: 'domain' } }))
    expect(dot).not.toContain('rank = "same"')
    expect(dot).not.toContain('newrank')
  })
})
