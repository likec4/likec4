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
    // Should merge tags
    expect(edge).toHaveProperty('tags', [
      'next',
      'old'
    ])
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
        "tags": [
          "next",
          "old",
        ],
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
        "kind": "graphlql",
        "label": "custom label",
        "line": "dashed",
        "parent": null,
        "relations": [
          "cloud.frontend.adminPanel:cloud.backend.graphql",
        ],
        "source": "cloud.frontend.adminPanel",
        "tags": [
          "old",
        ],
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
        "kind": "graphlql",
        "label": "custom label",
        "line": "solid",
        "parent": null,
        "relations": [
          "cloud.frontend.dashboard:cloud.backend.graphql",
        ],
        "source": "cloud.frontend.dashboard",
        "tags": [
          "next",
        ],
        "target": "cloud.backend.graphql",
      }
    `)
  })

  it('set edge title to empty string', () => {
    const { edges, edgeIds } = computeView([
      $include($customRelation(
        'cloud.frontend.adminPanel -> cloud.backend',
        {
          title: ''
        }
      ))
    ])
    expect(edgeIds).toEqual([
      'cloud.frontend.adminPanel:cloud.backend'
    ])
    const [edge1] = edges
    expect(edge1).toHaveProperty('label', '')
  })

  it('handles <->', () => {
    // in model we have cloud -> amazon
    const { edges, edgeIds } = computeView([
      $include($customRelation(
        'amazon.* <-> cloud.*',
        {
          color: 'red',
          title: 'custom label'
        }
      ))
    ])
    expect(edgeIds).toEqual([
      'cloud.backend:amazon.s3'
    ])
    const [edge1] = edges
    expect(edge1).toMatchInlineSnapshot(`
      {
        "color": "red",
        "id": "cloud.backend:amazon.s3",
        "isCustomized": true,
        "label": "custom label",
        "parent": null,
        "relations": [
          "cloud.backend.storage:amazon.s3",
        ],
        "source": "cloud.backend",
        "tags": [
          "aws",
          "storage",
          "legacy",
        ],
        "target": "amazon.s3",
      }
    `)
  })
})
