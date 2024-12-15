import { indexBy, map, mapValues, pipe, prop } from 'remeda'
import type { BuildTuple } from 'type-fest/source/internal'
import { describe, expect, it } from 'vitest'
import type { ComputedNode } from '../../../types/view'
import { $exclude, $group, $include, $where, computeViewV2 as computeView } from './fixture'

function expectParents(nodes: ComputedNode[]) {
  return expect(
    pipe(
      nodes,
      indexBy(prop('id')),
      mapValues(prop('parent'))
    )
  )
}

describe('groups', () => {
  it('should include elements', () => {
    const { nodeIds, edgeIds, nodes } = computeView([
      $group([
        $include('support')
      ]),
      $group([
        $include('customer'),
        $include('-> cloud')
      ]),
      $exclude('customer')
    ])
    expect(nodeIds).toEqual([
      '@gr1',
      'support',
      '@gr2',
      'cloud'
    ])
    const [group1, support, group2, cloud] = nodes as BuildTuple<4, ComputedNode>
    expect(group1).toMatchObject({
      id: '@gr1',
      kind: '@group',
      children: ['support'],
      level: 0,
      depth: 1
    })
    expect(support).toMatchObject({
      id: 'support',
      parent: '@gr1'
    })
    expect(group2).toMatchObject({
      id: '@gr2',
      kind: '@group',
      children: ['cloud'],
      level: 0,
      depth: 1
    })
    expect(cloud).toMatchObject({
      id: 'cloud',
      parent: '@gr2'
    })

    expect(edgeIds).toEqual(['support:cloud'])
  })

  it('should include and keep elements in first-seen group', () => {
    const variant1 = computeView([
      $group([
        $include('customer'),
        $group([
          $include('customer')
        ])
      ])
    ])
    expectParents(variant1.nodes).toMatchInlineSnapshot(`
      {
        "@gr1": null,
        "@gr2": "@gr1",
        "customer": "@gr1",
      }
    `)

    const variant2 = computeView([
      $group([
        $group([
          $include('customer')
        ]),
        $include('customer')
      ])
    ])
    expectParents(variant2.nodes).toMatchInlineSnapshot(`
      {
        "@gr1": null,
        "@gr2": "@gr1",
        "customer": "@gr2",
      }
    `)

    const variant3 = computeView([
      $group([
        $group([
          $include('customer')
        ]),
        $exclude('customer'),
        $group([
          $include('customer')
        ])
      ])
    ])
    expectParents(variant3.nodes).toMatchInlineSnapshot(`
      {
        "@gr1": null,
        "@gr2": "@gr1",
        "@gr3": "@gr1",
        "customer": "@gr3",
      }
    `)
  })

  it('nested groups', () => {
    const { nodeIds, edgeIds, nodes, edges } = computeView([
      $group([
        $group([
          $include('cloud.frontend.*', {
            where: {
              tag: { eq: 'next' }
            }
          })
        ]),
        $group([
          $include('cloud.frontend.adminPanel'),
          $include('cloud.backend')
        ]),
        $group([
          $include('support ->')
        ])
      ]),
      $group([
        $include('customer ->')
      ])
    ])
    expect(nodeIds).toEqual([
      '@gr5',
      'customer',
      '@gr1',
      '@gr4',
      'support',
      '@gr2',
      'cloud.frontend.dashboard',
      '@gr3',
      'cloud.frontend.adminPanel',
      'cloud.backend'
    ])
    // parent of each node
    expect(
      pipe(
        nodes,
        indexBy(prop('id')),
        mapValues(prop('parent'))
      )
    ).toMatchInlineSnapshot(`
      {
        "@gr1": null,
        "@gr2": "@gr1",
        "@gr3": "@gr1",
        "@gr4": "@gr1",
        "@gr5": null,
        "cloud.backend": "@gr3",
        "cloud.frontend.adminPanel": "@gr3",
        "cloud.frontend.dashboard": "@gr2",
        "customer": "@gr5",
        "support": "@gr4",
      }
    `)

    // Children of each node
    expect(
      pipe(
        nodes,
        indexBy(prop('id')),
        mapValues(prop('children'))
      )
    ).toMatchInlineSnapshot(`
      {
        "@gr1": [
          "@gr4",
          "@gr2",
          "@gr3",
        ],
        "@gr2": [
          "cloud.frontend.dashboard",
        ],
        "@gr3": [
          "cloud.frontend.adminPanel",
          "cloud.backend",
        ],
        "@gr4": [
          "support",
        ],
        "@gr5": [
          "customer",
        ],
        "cloud.backend": [],
        "cloud.frontend.adminPanel": [],
        "cloud.frontend.dashboard": [],
        "customer": [],
        "support": [],
      }
    `)

    expect(edgeIds).toEqual([
      'customer:cloud.frontend.dashboard',
      'support:cloud.frontend.adminPanel',
      'cloud.frontend.dashboard:cloud.backend',
      'cloud.frontend.adminPanel:cloud.backend'
    ])

    // parents of edges
    expect(
      pipe(
        edges,
        map(e => ({
          ...e,
          id: `${e.source}:${e.target}`
        })),
        indexBy(prop('id')),
        mapValues(prop('parent'))
      )
    ).toMatchInlineSnapshot(`
      {
        "cloud.frontend.adminPanel:cloud.backend": "@gr3",
        "cloud.frontend.dashboard:cloud.backend": "@gr1",
        "customer:cloud.frontend.dashboard": null,
        "support:cloud.frontend.adminPanel": "@gr1",
      }
    `)
  })
})
