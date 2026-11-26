import type { DeploymentViewRuleRank, RankValue } from '../../../types'
import { describe, expect, it } from 'vitest'
import { $include, computeViewWithRules } from './fixture'

const deploymentRef = (deployment: string, selector?: 'children' | 'expanded' | 'descendants') => ({
  ref: { deployment },
  ...(selector && { selector }),
})

const rank = (value: RankValue, ...targets: DeploymentViewRuleRank<any>['targets']): DeploymentViewRuleRank<any> => ({
  rank: value,
  targets,
})

describe('rank rules in deployment views', () => {
  it('resolves instances in different zones', () => {
    const view = computeViewWithRules(
      [rank('same', deploymentRef('prod.eu.zone1.api'), deploymentRef('prod.us.zone1.api'))],
      $include('prod.**'),
    )
    expect(view.ranks).toEqual([
      { type: 'same', nodes: ['prod.eu.zone1.api', 'prod.us.zone1.api'] },
    ])
  })

  it('resolves a logical element to its instances in the view', () => {
    const view = computeViewWithRules(
      [rank('min', { ref: { model: 'cloud.backend.api' } })],
      $include('prod.eu.**'),
    )
    expect(view.ranks).toEqual([
      { type: 'min', nodes: ['prod.eu.zone1.api', 'prod.eu.zone2.api'] },
    ])
  })

  it('resolves selectors', () => {
    const view = computeViewWithRules(
      [rank('sink', deploymentRef('prod.eu', 'children'))],
      $include('prod.eu.**'),
    )
    expect(view.ranks).toEqual([
      { type: 'sink', nodes: expect.arrayContaining(['prod.eu.zone1', 'prod.eu.db']) },
    ])
    expect(view.ranks?.[0]?.nodes).not.toContain('prod.eu.zone1.api')
  })

  it('keeps the order of the rules', () => {
    const view = computeViewWithRules(
      [
        rank('max', deploymentRef('prod.eu.db')),
        rank('min', deploymentRef('prod.us.db')),
      ],
      $include('prod.**'),
    )
    expect(view.ranks?.map(r => r.type)).toEqual(['max', 'min'])
  })

  it('ignores targets that are not in the view', () => {
    const view = computeViewWithRules(
      [
        rank('same', deploymentRef('prod.eu.db'), deploymentRef('prod.us.db')),
        rank('min', deploymentRef('prod.us.zone1.api')),
      ],
      $include('prod.eu.**'),
    )
    expect(view.ranks).toEqual([
      { type: 'same', nodes: ['prod.eu.db'] },
    ])
  })

  it('has no ranks without rank rules', () => {
    const view = computeViewWithRules([], $include('prod.**'))
    expect(view).not.toHaveProperty('ranks')
  })
})
