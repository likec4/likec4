import type { ComputedDeploymentView } from '@likec4/core'
import { Builder } from '@likec4/core/builder'
import { describe, it } from 'vitest'
import { DeploymentViewPrinter } from './DeploymentViewPrinter'

describe('DeploymentViewPrinter', () => {
  const model = Builder
    .specification({
      elements: {
        el: {},
      },
      deployments: {
        node: {},
      },
    })
    .model(({ el, rel }, _) =>
      _(
        el('client'),
        el('cloud'),
        el('cloud.ui'),
        el('cloud.backend'),
        el('cloud.backend.api'),
        el('cloud.db'),
        rel('client', 'cloud.ui', {
          title: 'uses',
        }),
        rel('cloud.ui', 'cloud.backend.api', {
          title: 'fetches',
          technology: 'REST',
        }),
        rel('cloud.backend.api', 'cloud.db', {
          title: 'very very very long title that should be wrapped to multiple lines',
        }),
      )
    )
    .deployment(({ node, instanceOf }, _) =>
      _(
        node('client').with(
          instanceOf('client'),
        ),
        node('z1'),
        node('z1.s1').with(
          instanceOf('cloud.ui'),
          instanceOf('cloud.backend.api'),
        ),
        node('z1.s2').with(
          instanceOf('cloud.ui'),
          instanceOf('cloud.backend.api'),
        ),
        instanceOf('z1.db', 'cloud.db'),
      )
    )
    .views(({ deploymentView, $include }, _) =>
      _(
        deploymentView('index').with(
          $include('*'),
          $include('z1.**'),
        ),
      )
    )
    .toLikeC4Model()

  it('print deployment view', async ({ expect }) => {
    const computedIndexView = model.view('index').$view as ComputedDeploymentView
    const dot = new DeploymentViewPrinter(computedIndexView).print()
    await expect(dot).toMatchFileSnapshot('__snapshots__/DeploymentViewPrinter-index.dot')
  })
})
