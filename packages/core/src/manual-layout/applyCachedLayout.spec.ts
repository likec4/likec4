import { indexBy } from 'remeda'
import { describe, expect, it } from 'vitest'

import type { ComputedEdge, ComputedNode, ComputedView, LayoutedView } from '../types'
import { _layout, _stage } from '../types'
import { prepareFixtures } from './__test__/fixture'
import { applyCachedLayout } from './applyCachedLayout'

/**
 * Strips layout-specific fields from a LayoutedView to produce a ComputedView.
 * Optionally applies overrides to simulate metadata changes.
 */
function toComputedView(
  layouted: LayoutedView,
  overrides?: {
    view?: Partial<ComputedView>
    nodes?: Record<string, Partial<ComputedNode>>
    edges?: Record<string, Partial<ComputedEdge>>
  },
): ComputedView {
  let nodes = layouted.nodes.map(
    ({ x, y, width, height, labelBBox, drifts, ...computed }) => computed as unknown as ComputedNode,
  )
  let edges = layouted.edges.map(
    ({ points, controlPoints, labelBBox, drifts, ...computed }) => computed as unknown as ComputedEdge,
  )

  if (overrides?.nodes) {
    nodes = nodes.map(n => {
      const patch = overrides.nodes![n.id]
      return patch ? { ...n, ...patch } as ComputedNode : n
    })
  }
  if (overrides?.edges) {
    edges = edges.map(e => {
      const patch = overrides.edges![e.id]
      return patch ? { ...e, ...patch } as ComputedEdge : e
    })
  }

  const {
    bounds: _bounds,
    drifts: _drifts,
    hasLayoutDrift: _hasLayoutDrift,
    [_layout]: _layoutType,
    [_stage]: _stageType,
    nodes: _nodes,
    edges: _edges,
    ...viewProps
  } = layouted as any

  return {
    ...viewProps,
    [_stage]: 'computed',
    nodes,
    edges,
    ...overrides?.view,
  } as ComputedView
}

describe('applyCachedLayout', () => {
  it('should preserve layout positions from cached view', () => {
    const { layouted } = prepareFixtures()
    const current = toComputedView(layouted)

    const result = applyCachedLayout(current, layouted)

    const cachedNodes = indexBy(layouted.nodes, n => n.id)
    for (const node of result.nodes) {
      const cached = cachedNodes[node.id]!
      expect(node.x).toBe(cached.x)
      expect(node.y).toBe(cached.y)
      expect(node.width).toBe(cached.width)
      expect(node.height).toBe(cached.height)
      expect(node.labelBBox).toEqual(cached.labelBBox)
    }
  })

  it('should preserve edge layout from cached view', () => {
    const { layouted } = prepareFixtures()
    const current = toComputedView(layouted)

    const result = applyCachedLayout(current, layouted)

    const cachedEdges = indexBy(layouted.edges, e => e.id)
    for (const edge of result.edges) {
      const cached = cachedEdges[edge.id]!
      expect(edge.points).toEqual(cached.points)
      expect(edge.label).toBe(cached.label)
      expect(edge.labelBBox).toEqual(cached.labelBBox)
    }
  })

  it('should preserve bounds from cached view', () => {
    const { layouted } = prepareFixtures()
    const current = toComputedView(layouted)

    const result = applyCachedLayout(current, layouted)

    expect(result.bounds).toEqual(layouted.bounds)
  })

  it('should set stage to layouted', () => {
    const { layouted } = prepareFixtures()
    const current = toComputedView(layouted)

    const result = applyCachedLayout(current, layouted)

    expect(result[_stage]).toBe('layouted')
  })

  describe('view-level metadata', () => {
    it('should update view title from current', () => {
      const { layouted } = prepareFixtures()
      const current = toComputedView(layouted, {
        view: { title: 'Updated Title' },
      })

      const result = applyCachedLayout(current, layouted)

      expect(result.title).toBe('Updated Title')
    })

    it('should update view description from current', () => {
      const { layouted } = prepareFixtures()
      const current = toComputedView(layouted, {
        view: { description: { md: 'Updated **description**' } },
      })

      const result = applyCachedLayout(current, layouted)

      expect(result.description).toEqual({ md: 'Updated **description**' })
    })

    it('should update view tags from current', () => {
      const { layouted } = prepareFixtures()
      const current = toComputedView(layouted, {
        view: { tags: ['tag-1', 'tag-3'] } as any,
      })

      const result = applyCachedLayout(current, layouted)

      expect(result.tags).toEqual(['tag-1', 'tag-3'])
    })

    it('should update view links from current', () => {
      const { layouted } = prepareFixtures()
      const current = toComputedView(layouted, {
        view: { links: [{ url: 'https://example.com' }] } as any,
      })

      const result = applyCachedLayout(current, layouted)

      expect(result.links).toEqual([{ url: 'https://example.com' }])
    })
  })

  describe('node metadata', () => {
    it('should update node color from current', () => {
      const { layouted, layoutedNodes } = prepareFixtures()
      const current = toComputedView(layouted, {
        nodes: { customer: { color: 'secondary' } },
      })

      const result = applyCachedLayout(current, layouted)
      const nodes = indexBy(result.nodes, n => n.id as string)

      expect(nodes['customer']).toMatchObject({
        color: 'secondary',
        x: layoutedNodes['customer']!.x,
        y: layoutedNodes['customer']!.y,
      })
    })

    it('should update node navigateTo from current', () => {
      const { layouted } = prepareFixtures()
      const current = toComputedView(layouted, {
        nodes: { customer: { navigateTo: 'other-view' as any } },
      })

      const result = applyCachedLayout(current, layouted)
      const nodes = indexBy(result.nodes, n => n.id as string)

      expect(nodes['customer']!.navigateTo).toBe('other-view')
    })

    it('should update node links from current', () => {
      const { layouted } = prepareFixtures()
      const current = toComputedView(layouted, {
        nodes: { customer: { links: [{ url: 'https://docs.example.com' }] } as any },
      })

      const result = applyCachedLayout(current, layouted)
      const nodes = indexBy(result.nodes, n => n.id as string)

      expect(nodes['customer']!.links).toEqual([{ url: 'https://docs.example.com' }])
    })

    it('should update node tags from current', () => {
      const { layouted } = prepareFixtures()
      const current = toComputedView(layouted, {
        nodes: { customer: { tags: ['tag-3'] as any } },
      })

      const result = applyCachedLayout(current, layouted)
      const nodes = indexBy(result.nodes, n => n.id as string)

      expect(nodes['customer']!.tags).toEqual(['tag-3'])
    })

    it('should update node notation from current', () => {
      const { layouted } = prepareFixtures()
      const current = toComputedView(layouted, {
        nodes: { customer: { notation: 'Component' } },
      })

      const result = applyCachedLayout(current, layouted)
      const nodes = indexBy(result.nodes, n => n.id as string)

      expect(nodes['customer']!.notation).toBe('Component')
    })

    it('should update node notes from current', () => {
      const { layouted } = prepareFixtures()
      const current = toComputedView(layouted, {
        nodes: { customer: { notes: { md: '**Important**' } } },
      })

      const result = applyCachedLayout(current, layouted)
      const nodes = indexBy(result.nodes, n => n.id as string)

      expect(nodes['customer']!.notes).toEqual({ md: '**Important**' })
    })

    it('should update multiple nodes at once', () => {
      const { layouted, layoutedNodes } = prepareFixtures()
      const current = toComputedView(layouted, {
        nodes: {
          customer: { color: 'red' },
          saas: { color: 'green' },
        },
      })

      const result = applyCachedLayout(current, layouted)
      const nodes = indexBy(result.nodes, n => n.id as string)

      expect(nodes['customer']!.color).toBe('red')
      expect(nodes['saas']!.color).toBe('green')
      // Layout preserved for both
      expect(nodes['customer']!.x).toBe(layoutedNodes['customer']!.x)
      expect(nodes['saas']!.x).toBe(layoutedNodes['saas']!.x)
    })
  })

  describe('edge metadata', () => {
    it('should update edge color from current', () => {
      const { layouted, layoutedEdges } = prepareFixtures()
      const current = toComputedView(layouted, {
        edges: { edge1: { color: 'secondary' } },
      })

      const result = applyCachedLayout(current, layouted)
      const edges = indexBy(result.edges, e => e.id as string)

      expect(edges['edge1']!.color).toBe('secondary')
      // Layout preserved
      expect(edges['edge1']!.points).toEqual(layoutedEdges['edge1']!.points)
    })

    it('should update edge tags from current', () => {
      const { layouted } = prepareFixtures()
      const current = toComputedView(layouted, {
        edges: { edge1: { tags: ['tag-1'] as any } },
      })

      const result = applyCachedLayout(current, layouted)
      const edges = indexBy(result.edges, e => e.id as string)

      expect(edges['edge1']!.tags).toEqual(['tag-1'])
    })

    it('should update edge navigateTo from current', () => {
      const { layouted } = prepareFixtures()
      const current = toComputedView(layouted, {
        edges: { edge1: { navigateTo: 'detail-view' as any } },
      })

      const result = applyCachedLayout(current, layouted)
      const edges = indexBy(result.edges, e => e.id as string)

      expect(edges['edge1']!.navigateTo).toBe('detail-view')
    })

    it('should update edge notes from current', () => {
      const { layouted } = prepareFixtures()
      const current = toComputedView(layouted, {
        edges: { edge2: { notes: { md: 'Updated edge note' } } },
      })

      const result = applyCachedLayout(current, layouted)
      const edges = indexBy(result.edges, e => e.id as string)

      expect(edges['edge2']!.notes).toEqual({ md: 'Updated edge note' })
    })

    it('should preserve cached edge label (wrapped version)', () => {
      const { layouted, layoutedEdges } = prepareFixtures()
      const current = toComputedView(layouted)

      const result = applyCachedLayout(current, layouted)
      const edges = indexBy(result.edges, e => e.id as string)

      expect(edges['edge1']!.label).toBe(layoutedEdges['edge1']!.label)
      expect(edges['edge2']!.label).toBe(layoutedEdges['edge2']!.label)
    })

    it('should preserve edge controlPoints from cache', () => {
      const { layouted } = prepareFixtures({
        edges: {
          edge1: {
            controlPoints: [{ x: 150, y: 140 }, { x: 250, y: 160 }],
          },
        },
      })
      const current = toComputedView(layouted)

      const result = applyCachedLayout(current, layouted)
      const edges = indexBy(result.edges, e => e.id as string)

      expect(edges['edge1']!.controlPoints).toEqual([{ x: 150, y: 140 }, { x: 250, y: 160 }])
    })
  })

  describe('_layout flag', () => {
    it('should set _layout to auto when hasManualLayout is true', () => {
      const { layouted } = prepareFixtures()
      const current = toComputedView(layouted, {
        view: { hasManualLayout: true } as any,
      })

      const result = applyCachedLayout(current, layouted)

      expect(result[_layout]).toBe('auto')
    })

    it('should set _layout to undefined when hasManualLayout is false', () => {
      const { layouted } = prepareFixtures()
      const current = toComputedView(layouted, {
        view: { hasManualLayout: false } as any,
      })

      const result = applyCachedLayout(current, layouted)

      expect(result[_layout]).toBeUndefined()
    })

    it('should set _layout to undefined when hasManualLayout is not set', () => {
      const { layouted } = prepareFixtures()
      const current = toComputedView(layouted)

      const result = applyCachedLayout(current, layouted)

      expect(result[_layout]).toBeUndefined()
    })

    it('should clear stale _layout from cached view when hasManualLayout becomes false', () => {
      const { layouted } = prepareFixtures()
      // Simulate cached view having _layout: 'auto' from previous state
      const cachedWithLayout = { ...layouted, [_layout]: 'auto' } as LayoutedView
      const current = toComputedView(layouted) // no hasManualLayout

      const result = applyCachedLayout(current, cachedWithLayout)

      expect(result[_layout]).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should keep cached node unchanged when not found in current view', () => {
      const { layouted, layoutedNodes } = prepareFixtures()
      // Remove a node from the current computed view
      const current = toComputedView(layouted)
      ;(current as any).nodes = current.nodes.filter(n => n.id !== 'customer')

      const result = applyCachedLayout(current, layouted)
      const nodes = indexBy(result.nodes, n => n.id as string)

      // Cached node preserved as-is (including stale data)
      expect(nodes['customer']).toEqual(layoutedNodes['customer'])
    })

    it('should keep cached edge unchanged when not found in current view', () => {
      const { layouted, layoutedEdges } = prepareFixtures()
      const current = toComputedView(layouted)
      ;(current as any).edges = current.edges.filter(e => e.id !== 'edge1')

      const result = applyCachedLayout(current, layouted)
      const edges = indexBy(result.edges, e => e.id as string)

      expect(edges['edge1']).toEqual(layoutedEdges['edge1'])
    })

    it('should handle empty nodes and edges', () => {
      const { layouted } = prepareFixtures()
      const cachedEmpty = {
        ...layouted,
        nodes: [],
        edges: [],
      } as unknown as LayoutedView
      const current = toComputedView(cachedEmpty)

      const result = applyCachedLayout(current, cachedEmpty)

      expect(result.nodes).toEqual([])
      expect(result.edges).toEqual([])
    })
  })
})
