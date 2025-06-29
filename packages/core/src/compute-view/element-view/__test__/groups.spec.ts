import { indexBy, map, mapValues, pipe, prop } from 'remeda'
import { describe, expect, it } from 'vitest'
import type { NTuple } from '../../../types'
import type { ComputedNode } from '../../../types'
import { $exclude, $group, $include, computeView } from './fixture'

function expectParents(nodes: ComputedNode[]) {
  return expect(
    pipe(
      nodes,
      indexBy(prop('id')),
      mapValues(prop('parent')),
    ),
  )
}

describe('groups', () => {
  it('should include elements', () => {
    const { nodeIds, edgeIds, nodes } = computeView([
      $group([
        $include('support'),
      ]),
      $group([
        $include('customer'),
        $include('-> cloud'),
      ]),
      $exclude('customer'),
    ])
    expect(nodeIds).toEqual([
      '@gr1',
      'support',
      '@gr2',
      'cloud',
    ])
    const [group1, support, group2, cloud] = nodes as NTuple<ComputedNode, 4>
    expect(group1).toMatchObject({
      id: '@gr1',
      kind: '@group',
      children: ['support'],
      level: 0,
      depth: 1,
    })
    expect(support).toMatchObject({
      id: 'support',
      parent: '@gr1',
    })
    expect(group2).toMatchObject({
      id: '@gr2',
      kind: '@group',
      children: ['cloud'],
      level: 0,
      depth: 1,
    })
    expect(cloud).toMatchObject({
      id: 'cloud',
      parent: '@gr2',
    })

    expect(edgeIds).toEqual(['support:cloud'])
  })

  it('should include and keep elements in first-seen group', () => {
    const variant1 = computeView([
      $group([
        $include('customer'),
        $group([
          $include('customer'),
        ]),
      ]),
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
          $include('customer'),
        ]),
        $include('customer'),
      ]),
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
          $include('customer'),
        ]),
        $exclude('customer'),
        $group([
          $include('customer'),
        ]),
      ]),
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
              tag: { eq: 'next' },
            },
          }),
        ]),
        $group([
          $include('cloud.frontend.supportPanel'),
          $include('cloud.backend'),
        ]),
        $group([
          $include('support ->'),
        ]),
      ]),
      $group([
        $include('customer ->'),
      ]),
      $exclude('cloud'),
      $exclude('cloud.frontend'),
    ])
    expect.soft(nodeIds).toEqual([
      '@gr1',
      '@gr4',
      '@gr5',
      'support',
      'customer',
      '@gr2',
      'cloud.frontend.dashboard',
      '@gr3',
      'cloud.frontend.supportPanel',
      'cloud.backend',
    ])
    // parent of each node
    expect(
      pipe(
        nodes,
        indexBy(prop('id')),
        mapValues(prop('parent')),
      ),
    ).toMatchInlineSnapshot(`
      {
        "@gr1": null,
        "@gr2": "@gr1",
        "@gr3": "@gr1",
        "@gr4": "@gr1",
        "@gr5": null,
        "cloud.backend": "@gr3",
        "cloud.frontend.dashboard": "@gr2",
        "cloud.frontend.supportPanel": "@gr3",
        "customer": "@gr5",
        "support": "@gr4",
      }
    `)

    // Children of each node
    expect(
      pipe(
        nodes,
        indexBy(prop('id')),
        mapValues(prop('children')),
      ),
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
          "cloud.frontend.supportPanel",
          "cloud.backend",
        ],
        "@gr4": [
          "support",
        ],
        "@gr5": [
          "customer",
        ],
        "cloud.backend": [],
        "cloud.frontend.dashboard": [],
        "cloud.frontend.supportPanel": [],
        "customer": [],
        "support": [],
      }
    `)

    expect(edgeIds).toEqual([
      'cloud.frontend.dashboard:cloud.backend',
      'cloud.frontend.supportPanel:cloud.backend',
      'support:cloud.frontend.supportPanel',
      'customer:cloud.frontend.dashboard',
    ])

    // parents of edges
    expect(
      pipe(
        edges,
        map(e => ({
          ...e,
          id: `${e.source}:${e.target}`,
        })),
        indexBy(prop('id')),
        mapValues(prop('parent')),
      ),
    ).toMatchInlineSnapshot(`
      {
        "cloud.frontend.dashboard:cloud.backend": "@gr1",
        "cloud.frontend.supportPanel:cloud.backend": "@gr3",
        "customer:cloud.frontend.dashboard": null,
        "support:cloud.frontend.supportPanel": "@gr1",
      }
    `)
  })

  it('should work with deep nesting', () => {
    const { nodeIds, nodes } = computeView([
      $group([
        $group([
          $group([]),
          $group([]),
        ]),
      ]),
    ])
    expect.soft(nodeIds).toEqual([
      '@gr1',
      '@gr2',
      '@gr3',
      '@gr4',
    ])
    // parent of each node
    expect(
      pipe(
        nodes,
        indexBy(prop('id')),
        mapValues(prop('parent')),
      ),
    ).toMatchInlineSnapshot(`
      {
        "@gr1": null,
        "@gr2": "@gr1",
        "@gr3": "@gr2",
        "@gr4": "@gr2",
      }
    `)
  })
})
