import { describe, expect, it } from 'vitest'
import type { DeploymentRulesBuilderOp } from '../../../builder'
import { $exclude, $include, builder } from './fixture'
import { TestHelper } from './TestHelper'

const navigationBuilder = builder.clone().views(v => v.deploymentView('index'))
const t = TestHelper.from(navigationBuilder)

function computeView(...rules: DeploymentRulesBuilderOp<typeof navigationBuilder.Types>[]) {
  const view = t.computeView(...rules)
  return {
    ...view,
    nodeIds: view.nodes.map(n => n.id),
    edgeIds: view.edges.map(e => e.id),
  }
}

describe('deployment navigateTo', () => {
  it('includes a deployment node and preserves its connections', () => {
    const baseline = computeView($include('customer'), $include('prod.eu'))
    const view = computeView(
      $include('customer'),
      $include('prod.eu', { with: { navigateTo: 'index' } }),
    )

    expect(view.nodeIds).toEqual(baseline.nodeIds)
    expect(view.edgeIds).toEqual(baseline.edgeIds)
    expect(view.hash).toBe(baseline.hash)
    expect(view.nodes.find(n => n.id === 'prod.eu')).toMatchObject({
      navigateTo: 'index',
    })
    expect(view.nodes.find(n => n.id === 'customer')).not.toHaveProperty('navigateTo')
  })

  it('includes a deployed instance without changing other instances', () => {
    const view = computeView(
      $include('prod.eu.zone1.api', { with: { navigateTo: 'index' } }),
      $include('prod.eu.zone2.api'),
    )

    expect(view.nodes.find(n => n.id === 'prod.eu.zone1.api')).toMatchObject({
      navigateTo: 'index',
    })
    expect(view.nodes.find(n => n.id === 'prod.eu.zone2.api')).not.toHaveProperty('navigateTo')
  })

  it('applies where conditions to navigation, even for already included nodes', () => {
    const view = computeView(
      $include('prod.eu.zone1.*'),
      $include('prod.eu.zone1.*', {
        where: 'kind is component',
        with: { navigateTo: 'index' },
      }),
    )

    expect(view.nodes.find(n => n.id === 'prod.eu.zone1.api')).toMatchObject({
      navigateTo: 'index',
    })
    expect(view.nodes.find(n => n.id === 'prod.eu.zone1.ui')).not.toHaveProperty('navigateTo')
  })

  it('respects excludes after a customized include', () => {
    const view = computeView(
      $include('prod.eu.zone1.*', { with: { navigateTo: 'index' } }),
      $exclude('prod.eu.zone1.ui'),
    )

    expect(view.nodeIds).toContain('prod.eu.zone1.api')
    expect(view.nodeIds).not.toContain('prod.eu.zone1.ui')
    expect(view.nodes.find(n => n.id === 'prod.eu.zone1.api')).toMatchObject({
      navigateTo: 'index',
    })
  })

  it('supports wildcard and descendant selectors without changing inclusion', () => {
    const baseline = computeView($include('customer'), $include('prod.eu.**'))
    const view = computeView(
      $include('customer'),
      $include('prod.eu.**', { with: { navigateTo: 'index' } }),
    )
    expect(view.nodeIds).toEqual(baseline.nodeIds)
    expect(view.edgeIds).toEqual(baseline.edgeIds)
    const wildcardOnly = computeView($include('*', { with: { navigateTo: 'index' } }))
    expect(wildcardOnly.nodeIds).toEqual(computeView($include('*')).nodeIds)
    expect(wildcardOnly.nodes.every(n => n.navigateTo === 'index')).toBe(true)
    for (const id of baseline.nodeIds.filter(id => id.startsWith('prod.eu.'))) {
      expect(view.nodes.find(n => n.id === id)).toMatchObject({ navigateTo: 'index' })
    }
  })
})
