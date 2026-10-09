import { describe, expect, it, vi } from 'vitest'
import type { XYStoreApi } from '../hooks/useXYFlow'
import { createLayoutConstraints } from './useLayoutConstraints'

type MockNode = { id: string; parentId?: string; x: number; y: number; width: number; height: number }
type MockEdge = {
  id: string
  source: string
  target: string
  data: { points: [number, number][]; controlPoints: null; labelBBox: null }
}

function mockStore(nodes: MockNode[], edges: MockEdge[] = []) {
  const nodeLookup = new Map(nodes.map(n => [n.id, {
    id: n.id,
    parentId: n.parentId,
    position: { x: n.x, y: n.y },
    width: n.width,
    height: n.height,
    internals: { positionAbsolute: { x: n.x, y: n.y } },
  }]))
  const parentLookup = new Map<string, Map<string, unknown>>()
  for (const node of nodeLookup.values()) {
    if (node.parentId) {
      const children = parentLookup.get(node.parentId) ?? new Map()
      children.set(node.id, node)
      parentLookup.set(node.parentId, children)
    }
  }
  const triggerNodeChanges = vi.fn<(changes: unknown[]) => void>()
  const triggerEdgeChanges = vi.fn<(changes: unknown[]) => void>()
  const state = {
    nodeLookup,
    parentLookup,
    edges,
    edgeLookup: new Map(edges.map(edge => [edge.id, edge])),
    triggerNodeChanges,
    triggerEdgeChanges,
  }
  // oxlint-disable-next-line no-unsafe-type-assertion
  const store = { getState: () => state } as unknown as XYStoreApi
  return { store, triggerNodeChanges, triggerEdgeChanges }
}

describe('createLayoutConstraints.resize', () => {
  it('resizes leaf nodes and emits dimension changes', () => {
    const { store, triggerNodeChanges } = mockStore([
      { id: 'a', x: 0, y: 0, width: 100, height: 50 },
      { id: 'b', x: 200, y: 0, width: 300, height: 80 },
    ])
    const constraints = createLayoutConstraints(store, ['a', 'b'])
    constraints.resize('b', { width: 100 })
    constraints.updateXYFlow()

    expect(triggerNodeChanges).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ id: 'b', type: 'dimensions', dimensions: { width: 100, height: 80 } }),
    ]))
  })

  it('does not shrink compound nodes below their children', () => {
    const { store } = mockStore([
      { id: 'a', x: 0, y: 0, width: 100, height: 50 },
      { id: 'compound', x: 200, y: 0, width: 400, height: 300 },
      { id: 'child', parentId: 'compound', x: 50, y: 60, width: 200, height: 100 },
    ])
    const constraints = createLayoutConstraints(store, ['a', 'compound'])
    constraints.resize('compound', { width: 100, height: 50 })

    expect(constraints.rects.get('compound')?.dimensions).toEqual({ width: 50 + 200 + 42, height: 60 + 100 + 42 })
  })

  it('keeps control points null for a two-point edge when both endpoints resize', () => {
    const edge: MockEdge = {
      id: 'a-b',
      source: 'a',
      target: 'b',
      data: { points: [[100, 25], [200, 25]], controlPoints: null, labelBBox: null },
    }
    const { store, triggerEdgeChanges } = mockStore([
      { id: 'a', x: 0, y: 0, width: 100, height: 50 },
      { id: 'b', x: 200, y: 0, width: 100, height: 50 },
    ], [edge])
    const constraints = createLayoutConstraints(store, ['a', 'b'])
    constraints.resize('a', { width: 120 })
    constraints.updateXYFlow()

    expect(triggerEdgeChanges).toHaveBeenCalledWith([
      expect.objectContaining({
        item: expect.objectContaining({ data: expect.objectContaining({ controlPoints: null }) }),
      }),
    ])
  })

  it('keeps control points null for a two-point edge when one endpoint moves', () => {
    const edge: MockEdge = {
      id: 'a-b',
      source: 'a',
      target: 'b',
      data: { points: [[100, 25], [200, 25]], controlPoints: null, labelBBox: null },
    }
    const { store, triggerEdgeChanges } = mockStore([
      { id: 'a', x: 0, y: 0, width: 100, height: 50 },
      { id: 'b', x: 200, y: 0, width: 100, height: 50 },
    ], [edge])
    const constraints = createLayoutConstraints(store, ['a'])
    constraints.rects.get('a')!.positionAbsolute = { x: 20, y: 0 }
    constraints.updateXYFlow()

    expect(triggerEdgeChanges).toHaveBeenCalledWith([
      expect.objectContaining({
        item: expect.objectContaining({ data: expect.objectContaining({ controlPoints: null }) }),
      }),
    ])
  })
})
