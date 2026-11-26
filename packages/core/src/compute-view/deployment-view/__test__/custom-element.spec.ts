import type { ParsedDeploymentView } from '../../../types'
import { describe, expect, it } from 'vitest'
import { Builder } from '../../../builder'
import { LikeC4Model } from '../../../model'
import { computeDeploymentView } from '../compute'
import { $include, computeView } from './fixture'

function node(view: ReturnType<typeof computeView>, id: string) {
  const found = view.nodes.find(n => n.id === id)
  expect(found, `node ${id}`).toBeDefined()
  return found!
}

describe('custom element predicate (with) in deployment views', () => {
  it('includes the node and applies the custom properties', () => {
    const view = computeView(
      $include('prod.eu.zone1', {
        with: {
          title: 'Custom',
          color: 'red',
        },
      }),
    )
    expect(view.nodeIds).toContain('prod.eu.zone1')
    expect(node(view, 'prod.eu.zone1')).toMatchObject({
      title: 'Custom',
      color: 'red',
      isCustomized: true,
    })
  })

  it('customizes a node that is already included by another predicate', () => {
    const view = computeView(
      $include('prod.eu.zone1'),
      $include('prod.eu.zone2'),
      $include('prod.eu.zone1', {
        with: { title: 'Custom', color: 'red' },
      }),
    )
    expect(node(view, 'prod.eu.zone1')).toMatchObject({
      title: 'Custom',
      color: 'red',
      isCustomized: true,
    })
    expect(node(view, 'prod.eu.zone2')).not.toHaveProperty('isCustomized')
  })

  it('customizes a deployed instance', () => {
    const view = computeView(
      $include('prod.eu.zone1.ui', {
        with: { title: 'Custom' },
      }),
    )
    expect(view.nodeIds).toContain('prod.eu.zone1.ui')
    expect(node(view, 'prod.eu.zone1.ui')).toMatchObject({
      title: 'Custom',
      isCustomized: true,
    })
  })

  it('applies custom properties to nodes matched by a wildcard', () => {
    const view = computeView(
      $include('prod.eu.zone1.*', {
        with: { color: 'red' },
      }),
    )
    expect(view.nodeIds).toContain('prod.eu.zone1.api')
    expect(node(view, 'prod.eu.zone1.api')).toMatchObject({
      color: 'red',
      isCustomized: true,
    })
  })
})

describe('custom element predicate (with) and where conditions', () => {
  it('checks where kind against the deployed element kind, as navigateTo does', () => {
    const view = computeView(
      $include('prod.eu.zone1.*'),
      $include('prod.eu.zone1.*', {
        where: 'kind is component',
        with: { color: 'red' },
      }),
    )
    expect(node(view, 'prod.eu.zone1.api')).toMatchObject({ color: 'red', isCustomized: true })
    expect(node(view, 'prod.eu.zone1.ui')).not.toHaveProperty('isCustomized')
  })

  it('checks where metadata against the deployed instance', () => {
    const source = Builder
      .specification({
        elements: { component: {} },
        deployments: { zone: {} },
        metadataKeys: ['owner'],
      })
      .model(({ component }, _) => _(component('a'), component('b')))
      .deployment(({ zone, instanceOf }, _) =>
        _(
          zone('z').with(
            instanceOf('a', 'a', { metadata: { owner: 'team-a' } }),
            instanceOf('b', 'b'),
          ),
        )
      )
      .views(({ deploymentView, $include }, _) =>
        _(
          deploymentView('index').with(
            $include('z.*'),
            // the condition is replaced below: the builder has no string form for metadata conditions
            $include('z.*', { where: 'kind is component', with: { color: 'red' } }),
          ),
        )
      )
      .build()
    const model = LikeC4Model.fromParsed(source)
    const view = source.views.index as ParsedDeploymentView<typeof model.Aux>
    const custom = view.rules[1]?.include?.[0]
    if (!custom?.custom?.expr.where) {
      throw new Error('expected a custom expression with where')
    }
    custom.custom.expr.where.condition = { metadata: { key: 'owner', value: 'team-a' } }

    const computed = computeDeploymentView(model, view)
    expect(computed.nodes.find(n => n.id === 'z.a')).toMatchObject({ color: 'red', isCustomized: true })
    expect(computed.nodes.find(n => n.id === 'z.b')).not.toHaveProperty('isCustomized')
  })
})
