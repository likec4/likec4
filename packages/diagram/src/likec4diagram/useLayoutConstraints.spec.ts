import { BBox } from '@likec4/core/geometry'
import type { NonEmptyArray, Point } from '@likec4/core/types'
import { describe, expect, it, vi } from 'vitest'
import { selectLabelRoutes } from '../hooks/useEdgeTracks'
import type { XYStoreApi } from '../hooks/useXYFlow'
import type { Types } from './types'
import { createLayoutConstraints } from './useLayoutConstraints'

/** a minimal xyflow store with leaf nodes only */
function fakeStore(
  nodes: Array<{ id: string; x: number; y: number; width: number; height: number }>,
  edges: Array<
    Pick<Types.RelationshipEdge, 'id' | 'source' | 'target'> & { data: Partial<Types.RelationshipEdge['data']> }
  >,
) {
  const nodeLookup = new Map(nodes.map(n => [n.id, {
    id: n.id,
    type: 'element',
    position: { x: n.x, y: n.y },
    measured: { width: n.width, height: n.height },
    internals: { positionAbsolute: { x: n.x, y: n.y } },
    data: {},
  }]))
  const edgeLookup = new Map(edges.map(e => [e.id, { ...e, type: 'relationship' }]))
  const triggerEdgeChanges = vi.fn<(changes: Array<{ id: string; item: Types.RelationshipEdge }>) => void>(
    (changes) => {
      for (const change of changes) {
        edgeLookup.set(change.id, change.item)
      }
      state.edges = [...edgeLookup.values()]
    },
  )
  const state = {
    nodeLookup,
    nodes: [...nodeLookup.values()],
    parentLookup: new Map(),
    edges: [...edgeLookup.values()],
    edgeLookup,
    triggerNodeChanges: vi.fn<(changes: unknown[]) => void>(),
    triggerEdgeChanges,
  }
  const api = { getState: () => state } as unknown as XYStoreApi
  return {
    api,
    moveNode: (id: string, x: number, y: number) => {
      const node = nodeLookup.get(id)!
      node.position = { x, y }
      node.internals.positionAbsolute = { x, y }
    },
    edgeAfterDrag: (id: string) => {
      const changes = triggerEdgeChanges.mock.calls.at(-1)![0]
      return changes.find(c => c.id === id)!.item
    },
  }
}

// a vertical route from `a` down to `b`, with `c` sitting to the right of where the route lands after `b` moves right
const a = { id: 'a', x: 0, y: 0, width: 100, height: 60 }
const b = { id: 'b', x: 0, y: 300, width: 100, height: 60 }
const c = { id: 'c', x: 130, y: 100, width: 100, height: 60 }
const edge = (isLabelCustomized: boolean) => ({
  id: 'a-b',
  source: 'a',
  target: 'b',
  data: {
    points: [[50, 60], [50, 140], [50, 220], [50, 300]] as NonEmptyArray<Point>,
    controlPoints: null,
    labelBBox: { x: 54, y: 172, width: 40, height: 16 },
    isLabelCustomized,
    dir: 'forward' as const,
  },
})

describe('createLayoutConstraints under ortho routing', () => {
  it('places an auto-placed label on the new route, clear of every leaf node, when a node moves', () => {
    const store = fakeStore([a, b, c], [edge(false)])
    const solver = createLayoutConstraints(store.api, ['b'], 'ortho')
    store.moveNode('b', 200, 300)
    solver.flushPending()
    const { labelBBox, controlPoints } = store.edgeAfterDrag('a-b').data
    expect(controlPoints).not.toBeNull()
    expect(labelBBox).toMatchObject({ width: 40, height: 16 })
    for (const node of [a, b, c]) {
      expect(BBox.intersects(labelBBox!, node), `label off ${node.id}`).toBe(false)
    }
    // beside the route, not carried along with the old geometry: the old box shifted by the drag would sit on `c`
    expect(labelBBox).not.toEqual({ x: 54 + 200, y: 172, width: 40, height: 16 })
  })

  it('keeps carrying a label the user moved by hand', () => {
    const custom = fakeStore([a, b, c], [edge(true)])
    const solver = createLayoutConstraints(custom.api, ['b'], 'ortho')
    custom.moveNode('b', 200, 300)
    solver.flushPending()
    const placed = custom.edgeAfterDrag('a-b').data.labelBBox!
    // translated relative to the moving end, not re-placed: it keeps its height offset along the route
    expect(placed.width).toBe(40)
    expect(placed.y).toBe(172)
    expect(placed.x).toBeGreaterThan(54)
  })

  it('places all moved labels against the final tracks while preserving a hand-moved label', () => {
    const fixedLabel = { x: 60, y: 109, width: 40, height: 16 }
    const edges = [
      { ...edge(false), id: 'auto-1' },
      { ...edge(false), id: 'auto-2' },
      {
        id: 'manual',
        source: 'd',
        target: 'e',
        data: {
          ...edge(true).data,
          points: [[450, 60], [450, 140], [450, 220], [450, 300]] satisfies NonEmptyArray<Point>,
          labelBBox: fixedLabel,
        },
      },
    ]
    const store = fakeStore([a, b, c, { ...a, id: 'd', x: 400 }, { ...b, id: 'e', x: 400 }], edges)
    const solver = createLayoutConstraints(store.api, ['b'], 'ortho')
    store.moveNode('b', 200, 300)
    solver.flushPending()

    const routes = selectLabelRoutes(store.api.getState())
    const manual = routes.find(route => route.id === 'manual')!.labelBBox!
    expect(manual).toEqual(fixedLabel)
    for (const route of routes.filter(route => route.id !== 'manual')) {
      const label = route.labelBBox!
      for (const other of routes.filter(other => other.id !== route.id)) {
        expect(BBox.intersects(label, other.labelBBox!), `${route.id} clear of ${other.id}`).toBe(false)
      }
      for (const other of routes) {
        for (const [from, to] of other.segments) {
          const line = BBox.fromPoints([[from.x, from.y], [to.x, to.y]])
          expect(
            BBox.intersects(label, BBox.expand(line, 1)),
            `${route.id} clear of track ${other.id}`,
          ).toBe(false)
        }
      }
    }
  })

  it('restores the original labels when a drag returns to its starting position', () => {
    const original = edge(false)
    const store = fakeStore([a, b], [original])
    const solver = createLayoutConstraints(store.api, ['b'], 'ortho')
    store.moveNode('b', 200, 300)
    solver.flushPending()
    store.moveNode('b', 0, 300)
    solver.flushPending()
    expect(store.edgeAfterDrag('a-b').data.labelBBox).toEqual(original.data.labelBBox)
  })

  it('leaves spline label interpolation unchanged', () => {
    const store = fakeStore([a, b, c], [edge(false)])
    const solver = createLayoutConstraints(store.api, ['b'], 'spline')
    store.moveNode('b', 200, 300)
    solver.flushPending()
    expect(store.edgeAfterDrag('a-b').data.labelBBox).toEqual({ x: 148, y: 172, width: 40, height: 16 })
  })
})
