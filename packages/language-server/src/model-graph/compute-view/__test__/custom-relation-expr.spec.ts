import { title } from 'process'
import { describe, expect, it } from 'vitest'
import { $customRelation, $include, $style, computeView } from './fixture'

describe('custom-relation-expr', () => {
  it('include edge and apply props', () => {
    const { edges, nodeIds, edgeIds } = computeView([
      $include('customer'),
      $include('cloud.frontend'),
      $include($customRelation(
        '* -> cloud.backend',
        {
          color: 'red',
          head: 'diamond'
        }
      ))
    ])
    expect(nodeIds).toEqual([
      'customer',
      'cloud.frontend',
      'cloud.backend'
    ])
    expect(edgeIds).toEqual(['customer:cloud.frontend', 'cloud.frontend:cloud.backend'])
    const edge = edges[1]!
    expect(edge).toMatchInlineSnapshot(`
      {
        "color": "red",
        "head": "diamond",
        "id": "cloud.frontend:cloud.backend",
        "isCustomized": true,
        "label": "requests",
        "parent": null,
        "relations": [
          "cloud.frontend:cloud.backend",
          "cloud.frontend.dashboard:cloud.backend.graphql",
          "cloud.frontend.adminPanel:cloud.backend.graphql",
        ],
        "source": "cloud.frontend",
        "target": "cloud.backend",
      }
    `)
  })

  it('include edges and update title', () => {
    const { edges, edgeIds } = computeView([
      $include($customRelation(
        'cloud.frontend.* -> cloud.backend.*',
        {
          color: 'red',
          title: 'custom label',
          head: 'crow'
        }
      ))
    ])
    expect(edgeIds).toEqual([
      'cloud.frontend.adminPanel:cloud.backend.graphql',
      'cloud.frontend.dashboard:cloud.backend.graphql'
    ])
    const [edge1, edge2] = edges
    expect(edge1).toMatchInlineSnapshot(`
      {
        "color": "red",
        "head": "crow",
        "id": "cloud.frontend.adminPanel:cloud.backend.graphql",
        "isCustomized": true,
        "label": "custom label",
        "line": "dashed",
        "parent": null,
        "relations": [
          "cloud.frontend.adminPanel:cloud.backend.graphql",
        ],
        "source": "cloud.frontend.adminPanel",
        "tail": "odiamond",
        "target": "cloud.backend.graphql",
      }
    `)
    expect(edge2).toMatchInlineSnapshot(`
      {
        "color": "red",
        "head": "crow",
        "id": "cloud.frontend.dashboard:cloud.backend.graphql",
        "isCustomized": true,
        "label": "custom label",
        "line": "solid",
        "parent": null,
        "relations": [
          "cloud.frontend.dashboard:cloud.backend.graphql",
        ],
        "source": "cloud.frontend.dashboard",
        "target": "cloud.backend.graphql",
      }
    `)
  })
})
