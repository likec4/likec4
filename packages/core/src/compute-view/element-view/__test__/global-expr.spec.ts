import { pick } from 'remeda'
import { describe, expect, it } from 'vitest'
import { $global, $include, $style, computeView } from './fixture'

describe('global expr', () => {
  it('style applied', () => {
    const { nodeIds, nodes } = computeView([
      $include('cloud.frontend.dashboard'), // has tag `next`
      $include('cloud.frontend.adminPanel'), // has tag `old`
      $include('cloud'), // has both tags
      $include('amazon'), // has tag `amazon`
      $style('*', {
        color: 'green'
      }),
      $global('style mute_old'),
      $global('style red_next')
    ])
    expect(nodeIds).toEqual([
      'cloud',
      'amazon',
      'cloud.frontend.dashboard',
      'cloud.frontend.adminPanel'
    ])
    const [cloud, amazon, dashboard, adminPanel] = nodes
    expect(cloud).toHaveProperty('color', 'red')
    expect(amazon).toHaveProperty('color', 'green')
    expect(dashboard).toHaveProperty('color', 'red')
    expect(adminPanel).toHaveProperty('color', 'muted')
  })

  it('apply global exclude predicate', () => {
    const before = computeView([
      $include('cloud.**') // has tag `next`
    ])
    expect(pick(before, ['edgeIds', 'nodeIds'])).toEqual({
      edgeIds: [
        'cloud.backend.graphql:cloud.backend.storage',
        'cloud.frontend.adminPanel:cloud.backend.graphql',
        'cloud.frontend.dashboard:cloud.backend.graphql'
      ],
      nodeIds: [
        'cloud.frontend',
        'cloud.frontend.adminPanel',
        'cloud.frontend.dashboard',
        'cloud.backend',
        'cloud.backend.graphql',
        'cloud.backend.storage'
      ]
    })
    const nodes_with_old = before.nodes.filter(n => n.tags?.includes('old' as any)).map(n => n.id)
    expect(nodes_with_old).toEqual([
      'cloud.frontend.adminPanel',
      'cloud.backend.storage'
    ])

    // Now apply global predicate
    const after = computeView([
      $include('cloud.**'), // has tag `next`
      $global('predicate remove_tag_old')
    ])
    expect(pick(after, ['edgeIds', 'nodeIds'])).toEqual({
      edgeIds: [
        'cloud.frontend.dashboard:cloud.backend.graphql'
      ],
      nodeIds: [
        'cloud.frontend',
        'cloud.frontend.dashboard',
        'cloud.backend',
        'cloud.backend.graphql'
      ]
    })
  })

  it('apply global include predicate', () => {
    const before = computeView([
      $global('predicate include_next')
    ])
    expect(pick(before, ['edgeIds', 'nodeIds'])).toEqual({
      'edgeIds': [
        'cloud.frontend.dashboard:cloud.backend.graphql',
        'cloud.frontend.adminPanel:cloud.backend.graphql',
        'cloud.backend:email'
      ],
      'nodeIds': [
        'cloud',
        'cloud.frontend.dashboard',
        'cloud.frontend.adminPanel',
        'cloud.backend',
        'email',
        'cloud.backend.graphql'
      ]
    })
  })
})
