import { describe, expect, it } from 'vitest'

import { type WritableDraft } from 'immer'
import { indexBy } from 'remeda'
import { type DiagramEdge, type LayoutedElementView, _type } from '../types'
import { type Patches, prepareFixtures } from './__test__/fixture'
import { applyManualLayout } from './applyManualLayout'
import { calcDriftsFromSnapshot } from './calcDriftsFromSnapshot'

function testApplyManualLayout<const Nodes, Edges>(patches?: Patches<Nodes, Edges>) {
  const {
    snapshot,
    snapshotNodes,
    snapshotEdges,
    layouted,
    layoutedNodes,
    layoutedEdges,
  } = prepareFixtures(patches)

  const result = applyManualLayout(layouted, snapshot)

  const nodes = indexBy(result.nodes, n => n.id) as typeof snapshotNodes
  const edges = indexBy(result.edges, e => e.id) as typeof snapshotEdges

  return {
    result,
    nodes, // nodes after applying manual layout
    edges, // edges after applying manual layout
    snapshot,
    snapshotNodes,
    snapshotEdges,
    layouted,
    layoutedNodes,
    layoutedEdges,
  }
}

describe('applyManualLayout', () => {
  it('should detect type-changed drift', () => {
    const { result, snapshot, layouted } = testApplyManualLayout({
      view: {
        // Change view type from 'element' to 'deployment'
        _type: 'deployment' as any,
      },
    })
    expect(layouted[_type]).toBe('deployment')

    expect(result.drifts).toEqual(['type-changed'])
    expect(result[_type]).toBe(snapshot[_type])
    expect(result[_type]).not.toBe(layouted[_type])
  })

  it('should apply manual layout without drifts when nothing changed', () => {
    const { result, snapshot } = testApplyManualLayout()

    expect(result._layout).toBe('manual')
    expect(result.drifts).toBeUndefined()
    expect(result.nodes).toHaveLength(snapshot.nodes.length)
  })

  describe('nodes', () => {
    it('should detect nodes-added drift', () => {
      const { result } = testApplyManualLayout({
        nodes: {
          newnode: {
            title: 'New Node',
            x: 100,
            y: 100,
          },
        },
      })

      expect(result.drifts).toEqual(['nodes-added'])
    })

    it('should detect nodes-removed drift', () => {
      const { result, nodes: { customer } } = testApplyManualLayout({
        nodes: {
          'customer': null,
        },
      })

      expect(result.drifts).toEqual(['nodes-removed'])
      expect(customer.drifts).toEqual(['removed'])
    })

    it('should auto-apply color and kind changes', () => {
      const { result, nodes: { customer } } = testApplyManualLayout({
        nodes: {
          customer: {
            color: 'secondary',
            kind: 'system',
          },
        },
      })

      expect(result.drifts).toBeUndefined()
      expect(customer.color).toBe('secondary')
      expect(customer.kind).toBe('system')
      expect(customer.drifts).toBeUndefined()
    })

    it('should auto-apply tags changes', () => {
      const { result, nodes, snapshotNodes } = testApplyManualLayout({
        nodes: {
          'customer': {
            tags: ['tag-1', 'tag-3'],
          },
        },
      })
      expect(nodes.customer).not.toEqual(snapshotNodes.customer)

      expect(nodes.customer.tags).toEqual(['tag-1', 'tag-3'])
      expect(nodes.customer.drifts).toBeUndefined()
      expect(result.drifts).toBeUndefined()
    })

    it('should auto-apply shape change when size not changed', () => {
      const { nodes: { customer } } = testApplyManualLayout({
        nodes: {
          'customer': {
            shape: 'cylinder',
          },
        },
      })

      expect(customer.shape).toBe('cylinder')
      expect(customer.drifts).toBeUndefined()
    })

    it('should detect shape-changed drift when size increased', () => {
      const { result, nodes: { customer } } = testApplyManualLayout({
        nodes: {
          'customer': d => {
            d.shape = 'cylinder'
            d.width = d.width + 100
          },
        },
      })

      expect(customer.drifts).toEqual(['shape-changed'])
      expect(result.drifts).toEqual(['nodes-drift'])
    })

    it('should auto-apply title change when size not changed', () => {
      const { nodes: { customer } } = testApplyManualLayout({
        nodes: {
          'customer': {
            title: 'Updated Customer',
          },
        },
      })

      expect(customer.title).toBe('Updated Customer')
      expect(customer.drifts).toBeUndefined()
    })

    it('should detect label-changed drift when size increased significantly', () => {
      const { result, nodes: { customer } } = testApplyManualLayout({
        nodes: {
          'customer': d => {
            d.title = 'A Much Longer Title That Requires More Space'
            d.width = d.width + 100
            d.height = d.height + 50
          },
        },
      })

      expect(customer.drifts).toEqual(['label-changed'])
      expect(result.drifts).toEqual(['nodes-drift'])
    })

    it('should auto-apply icon change when icon was already set', () => {
      const { nodes } = testApplyManualLayout({
        nodes: {
          'saas.frontend': {
            icon: 'tech:vue',
          },
        },
      })

      expect(nodes['saas.frontend'].icon).toBe('tech:vue')
      expect(nodes['saas.frontend'].drifts).toBeUndefined()
    })

    it('should auto-apply icon removal', () => {
      const { nodes } = testApplyManualLayout({
        nodes: {
          'saas.frontend': {
            icon: 'none',
          },
        },
      })

      expect(nodes['saas.frontend'].icon).toBe('none')
      expect(nodes['saas.frontend'].drifts).toBeUndefined()
    })

    it('should detect label-changed drift when icon added and size increased', () => {
      const { result, nodes: { customer } } = testApplyManualLayout({
        nodes: {
          'customer': d => {
            d.icon = 'tech:aws'
            d.width = d.width + 100
          },
        },
      })

      expect(customer.drifts).toEqual(['label-changed'])
      expect(result.drifts).toEqual(['nodes-drift'])
    })

    it('should auto-apply description and technology changes', () => {
      const description = {
        md: 'Updated description to markdown',
      }
      const { nodes: { customer } } = testApplyManualLayout({
        nodes: {
          'customer': {
            description: description,
            technology: 'Web',
          },
        },
      })

      expect(customer.description).toEqual(description)
      expect(customer.technology).toBe('Web')
      expect(customer.drifts).toBeUndefined()
    })

    it('should detect parent-changed drift', () => {
      const { result, nodes } = testApplyManualLayout({
        nodes: {
          'saas.frontend': {
            parent: 'customer' as any,
          },
        },
      })

      expect(nodes['saas.frontend'].drifts).toEqual(['parent-changed'])
      expect(result.drifts).toEqual(['nodes-drift'])
    })

    it('should detect became-compound drift', () => {
      const { nodes: { customer } } = testApplyManualLayout({
        nodes: {
          'customer': {
            children: ['saas'] as any,
          },
        },
      })

      expect(customer.drifts).toContain('became-compound')
    })

    it('should detect became-leaf drift', () => {
      const { nodes } = testApplyManualLayout({
        nodes: {
          'saas': {
            children: [],
          },
        },
      })

      expect(nodes.saas.drifts).toContain('became-leaf')
    })

    it('should detect children-changed drift', () => {
      const { nodes } = testApplyManualLayout({
        nodes: {
          'saas': d => {
            d.children = ['saas.frontend'] as any
          },
        },
      })

      expect(nodes.saas.drifts).toContain('children-changed')
    })

    it('should auto-apply style.border, style.opacity, style.multiple', () => {
      const { nodes: { customer } } = testApplyManualLayout({
        nodes: {
          'customer': {
            style: {
              border: 'dashed',
              opacity: 0.5,
              multiple: true,
            },
          },
        },
      })

      expect(customer.style.border).toBe('dashed')
      expect(customer.style.opacity).toBe(0.5)
      expect(customer.style.multiple).toBe(true)
      expect(customer.drifts).toBeUndefined()
    })

    it('should apply view metadata from auto-layouted', () => {
      const { result } = testApplyManualLayout({
        view: {
          title: 'New Title',
          description: {
            txt: 'New Description',
          },
          tags: ['view-tag'],
        },
      })

      expect(result.title).toBe('New Title')
      expect(result.description).toEqual({
        txt: 'New Description',
      })
      expect(result.tags).toEqual(['view-tag'])
    })

    it('should auto-apply labels to compound nodes always', () => {
      const { result, nodes } = testApplyManualLayout({
        nodes: {
          'saas': d => {
            d.title = 'Updated SaaS'
            d.description = {
              md: 'New description',
            }
            d.width = d.width + 200
          },
        },
      })

      expect(nodes.saas.title).toBe('Updated SaaS')
      expect(nodes.saas.description).toEqual({ md: 'New description' })
      expect(nodes.saas.drifts).toBeUndefined()
      expect(result.drifts).toBeUndefined()
    })
  })

  describe('edges', () => {
    it('should detect edges-added drift', () => {
      const { result } = testApplyManualLayout({
        edges: {
          'customer -> customer': {
            label: 'New Edge',
          },
        },
      })
      expect(result.drifts).toEqual(['edges-added'])
    })

    it('should detect edges-removed drift', () => {
      const { result, edges } = testApplyManualLayout({
        edges: {
          'edge1': null,
        },
      })
      expect(result.drifts).toEqual(['edges-removed'])
      expect(edges.edge1.drifts).toEqual(['removed'])
    })

    it('should auto-apply edge color, line, tags, notes', () => {
      const { result, edges, layoutedEdges, snapshotEdges } = testApplyManualLayout({
        edges: {
          'edge1': {
            color: 'secondary',
            line: 'dashed',
            tags: ['tag-3'],
            notes: { txt: 'Updated notes' },
          },
        },
      })
      expect(result.drifts).toBeUndefined()
      expect(edges.edge1).not.toBe(layoutedEdges.edge1)
      expect(edges.edge1).not.toBe(snapshotEdges.edge1)
      expect(edges.edge1.color).toBe('secondary')
      expect(edges.edge1.line).toBe('dashed')
      expect(edges.edge1.tags).toEqual(['tag-3'])
      expect(edges.edge1.notes).toBe(layoutedEdges.edge1.notes)
    })

    it('should detect direction-changed drift when edge direction reversed', () => {
      const { result, edges } = testApplyManualLayout({
        edges: {
          'edge1': e => {
            const temp = e.source
            e.source = e.target
            e.target = temp
          },
        },
      })
      expect(result.drifts).toEqual(['edges-drift'])
      expect(edges.edge1.drifts).toEqual(['direction-changed'])
    })

    it('should detect source-changed drift', () => {
      const { result, edges } = testApplyManualLayout({
        edges: {
          'edge1': {
            source: 'saas.api',
          },
        },
      })
      expect(result.drifts).toEqual(['edges-drift'])
      expect(edges.edge1.drifts).toEqual(['source-changed'])
    })

    it('should detect target-changed drift', () => {
      const { result, edges } = testApplyManualLayout({
        edges: {
          'edge1': {
            target: 'saas.api',
          },
        },
      })
      expect(result.drifts).toEqual(['edges-drift'])
      expect(edges.edge1.drifts).toEqual(['target-changed'])
    })

    it('should detect both source and target changed', () => {
      const { result, edges } = testApplyManualLayout({
        edges: {
          'edge1': {
            source: 'saas.api',
            target: 'customer',
          },
        },
      })
      expect(result.drifts).toEqual(['edges-drift'])
      expect(edges.edge1.drifts).toEqual(['source-changed', 'target-changed'])
    })

    it('should auto-apply label but keep size when labelBBox area increases significantly', () => {
      const { result, edges, snapshotEdges, layoutedEdges } = testApplyManualLayout({
        edges: {
          'edge1': e => {
            e.label = 'A Much Longer Edge Label That Requires More Space'
            e.labelBBox!.width += 100
            e.labelBBox!.height += 100
          },
        },
      })
      expect(result.drifts).toBeUndefined()
      // Label should be auto-applied
      expect(edges.edge1.label).toBe(layoutedEdges.edge1.label)
      // Size should be updated to layoutedEdges when size increased significantly
      expect(edges.edge1.labelBBox).toEqual({
        x: snapshotEdges.edge1.labelBBox!.x,
        y: snapshotEdges.edge1.labelBBox!.y,
        width: layoutedEdges.edge1.labelBBox!.width,
        height: layoutedEdges.edge1.labelBBox!.height,
      })
    })

    it('should auto-apply label when labelBBox size decreases but keep old size', () => {
      const { result, edges, snapshotEdges } = testApplyManualLayout({
        edges: {
          'edge1': e => {
            e.label = 'Short'
            e.labelBBox!.width -= 10
            e.labelBBox!.height -= 10
          },
        },
      })
      expect(result.drifts).toBeUndefined()
      expect(edges.edge1.label).toBe('Short')
      // Size should stay the same (from snapshot) when it decreases
      expect(edges.edge1.labelBBox).toEqual(snapshotEdges.edge1.labelBBox)
      expect(edges.edge1.drifts).toBeUndefined()
    })

    it('should detect label-added drift when labelBBox added', () => {
      const {
        snapshot: layouted, // swap,
        layouted: snapshot, // here we removed labelBBox to simulate adding it back
      } = prepareFixtures({
        edges: {
          edge1: d => {
            d.label = null
            delete d.labelBBox
          },
        },
      })
      expect(snapshot.edges.find(e => e.id === 'edge1')?.labelBBox).toBeFalsy()
      expect(layouted.edges.find(e => e.id === 'edge1')?.labelBBox).toBeTruthy()

      const result = applyManualLayout(layouted as LayoutedElementView, snapshot)
      expect(result.drifts).toEqual(['edges-drift'])
      const edges = indexBy(result.edges, e => e.id as 'edge1')
      expect(edges.edge1!.drifts).toEqual(['label-added'])
      // Should not add label automatically
      expect(edges.edge1!.label).toBeNull()
      expect(edges.edge1!.labelBBox).toBeUndefined()
    })

    it('should detect label-removed drift when labelBBox removed', () => {
      const { result, edges, snapshotEdges } = testApplyManualLayout({
        edges: {
          'edge1': e => {
            delete e.labelBBox
          },
        },
      })
      expect(result.drifts).toEqual(['edges-drift'])
      expect(edges.edge1.drifts).toEqual(['label-removed'])
      // Should keep the old label
      expect(edges.edge1.label).toEqual(snapshotEdges.edge1.label)
      expect(edges.edge1.labelBBox).toEqual(snapshotEdges.edge1.labelBBox)
    })

    it('should detect label-changed drift when label text is removed', () => {
      const { result, edges, snapshotEdges } = testApplyManualLayout({
        edges: {
          'edge1': e => {
            e.label = null as any
          },
        },
      })
      expect(result.drifts).toEqual(['edges-drift'])
      expect(edges.edge1.drifts).toEqual(['label-changed'])
      // Should keep the old label
      expect(edges.edge1.label).toBe(snapshotEdges.edge1.label)
    })

    it('should detect label-changed drift when description added', () => {
      const { result, edges, snapshotEdges, layoutedEdges } = testApplyManualLayout({
        edges: {
          'edge1': e => {
            e.description = { txt: 'New Description' }
          },
        },
      })
      // ensure old description was empty
      expect(snapshotEdges.edge1.description).toBeUndefined()
      expect(layoutedEdges.edge1.description).toBeDefined()

      expect(result.drifts).toEqual(['edges-drift'])
      expect(edges.edge1.drifts).toEqual(['label-changed'])
    })

    it('should detect label-changed drift when description removed', () => {
      const { result, edges, snapshotEdges, layoutedEdges } = testApplyManualLayout({
        edges: {
          'edge2': e => {
            e.description = null
          },
        },
      })
      // ensure old description was not empty
      expect(snapshotEdges.edge2.description).toBeTruthy()
      expect(layoutedEdges.edge2.description).toBeFalsy()

      expect(result.drifts).toEqual(['edges-drift'])
      expect(edges.edge2.drifts).toEqual(['label-changed'])
      // Should keep the old description
      expect(edges.edge2.description).toBe(snapshotEdges.edge2.description)
    })

    it('should detect label-changed drift when technology added', () => {
      const { result, edges, snapshotEdges } = testApplyManualLayout({
        edges: {
          'edge1': e => {
            e.technology = 'REST'
          },
        },
      })
      // ensure old technology was empty
      expect(snapshotEdges.edge1.technology).toBeFalsy()

      expect(result.drifts).toEqual(['edges-drift'])
      expect(edges.edge1.drifts).toEqual(['label-changed'])
      expect(edges.edge1.technology).toEqual('REST')
    })

    it('should detect label-changed drift when technology removed', () => {
      const { result, edges, snapshotEdges } = testApplyManualLayout({
        edges: {
          'edge2': e => {
            e.technology = null
          },
        },
      })
      // ensure old technology was set
      expect(snapshotEdges.edge2.technology).toBeTruthy()

      expect(result.drifts).toEqual(['edges-drift'])
      expect(edges.edge2.drifts).toEqual(['label-changed'])
      // Should keep the old technology
      expect(edges.edge2.technology).toBe(snapshotEdges.edge2.technology)
    })

    it('should auto-apply label, description, technology changes without drift', () => {
      const { result, edges, snapshotEdges } = testApplyManualLayout({
        edges: {
          'edge2': e => {
            e.label = 'Updated Label'
            e.description = { txt: 'Updated Description' }
            e.technology = 'GraphQL'
            // Keep size small to avoid drift
            e.labelBBox!.width = 80
            e.labelBBox!.height = 30
          },
        },
      })
      expect(result.drifts).toBeUndefined()
      expect(edges.edge2.label).toBe('Updated Label')
      expect(edges.edge2.description).toEqual({ txt: 'Updated Description' })
      expect(edges.edge2.technology).toBe('GraphQL')

      // Keep size the same (from snapshot)
      expect(edges.edge2.labelBBox).toBe(snapshotEdges.edge2.labelBBox)
    })

    it('should match edges by source/target when id changed', () => {
      const { result, edges, layoutedEdges } = testApplyManualLayout({
        edges: {
          'edge1': {
            id: 'edge1-modified',
            color: 'secondary',
          },
        },
      })
      // Should match by source/target and apply without drift
      expect(result.drifts).toBeUndefined()
      expect(layoutedEdges).not.toHaveProperty('edge1')
      expect(layoutedEdges).toHaveProperty('edge1-modified')
      expect(edges.edge1.color).toBe('secondary')
    })

    it('should detect dir property change', () => {
      const { result, edges, snapshotEdges } = testApplyManualLayout({
        edges: {
          'edge2': {
            dir: 'forward',
          },
        },
      })
      // Dir property changes are ignored when IDs and source/target match
      // The snapshot's dir is preserved
      expect(result.drifts).toEqual(['edges-drift'])
      expect(edges.edge2.dir).toBe(snapshotEdges.edge2.dir)
    })
  })
})
