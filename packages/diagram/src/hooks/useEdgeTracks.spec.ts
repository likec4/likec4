import type { NonEmptyArray, Point } from '@likec4/core/types'
import { describe, expect, it } from 'vitest'
import { selectTrackRoutes } from './useEdgeTracks'
import type { XYStoreState } from './useXYFlow'

const node = (id: string, x: number, y: number) =>
  [id, {
    id,
    type: 'element',
    position: { x, y },
    measured: { width: 100, height: 60 },
    internals: { positionAbsolute: { x, y } },
  }] as const

const state = (edges: unknown[]) =>
  ({
    nodeLookup: new Map([node('a', 0, 0), node('b', 0, 300)]),
    edges,
  }) as unknown as XYStoreState

describe('selectTrackRoutes', () => {
  it('draws an edited edge through its corners as a movable route bounded by its node boxes', () => {
    const edges = [{
      id: 'a-b',
      type: 'relationship',
      source: 'a',
      target: 'b',
      data: {
        points: [[50, 60], [50, 300]] as NonEmptyArray<Point>,
        controlPoints: [{ x: 50, y: 180 }],
        dir: 'forward',
      },
    }]
    const route = selectTrackRoutes(state(edges)).get('a-b')!
    expect(route.movable).toBe(true)
    expect(route.points[0]).toEqual({ x: 50, y: 62 })
    expect(route.points.at(-1)).toEqual({ x: 50, y: 298 })
    expect(route.movable && route.bounds).toEqual({
      from: { x: 0, y: 0, width: 100, height: 60 },
      to: { x: 0, y: 300, width: 100, height: 60 },
    })
  })

  it('keeps an untouched edge as its Graphviz polyline, not movable', () => {
    const edges = [{
      id: 'a-b',
      type: 'relationship',
      source: 'a',
      target: 'b',
      data: { points: [[50, 60], [50, 140], [50, 220], [50, 300]] as NonEmptyArray<Point>, controlPoints: null },
    }]
    const route = selectTrackRoutes(state(edges)).get('a-b')!
    expect(route.movable).toBe(false)
    expect(route.points).toEqual([{ x: 50, y: 60 }, { x: 50, y: 300 }])
  })

  it('starts a route at the handle xyflow reports to the edge, not at the box centre', () => {
    const s = state([{
      id: 'a-b',
      type: 'relationship',
      source: 'a',
      target: 'b',
      data: {
        points: [[50, 60], [50, 300]] as NonEmptyArray<Point>,
        controlPoints: [{ x: 50, y: 180 }],
        dir: 'forward',
      },
    }])
    // a 6px tall source handle sitting 3px below the box centre, as a handle placed at 50% without a translate does
    const a = s.nodeLookup.get('a')! as {
      internals: { positionAbsolute: { x: number; y: number }; handleBounds?: unknown }
    }
    a.internals.handleBounds = { source: [{ x: 47, y: 30, width: 6, height: 6 }], target: null }
    const route = selectTrackRoutes(s).get('a-b')!
    // the vertical run keeps x 50, the route is unchanged except that it is measured from y 33 before clipping
    expect(route.points[0]).toEqual({ x: 50, y: 62 })
  })

  it('is cached per edges array', () => {
    const s = state([])
    expect(selectTrackRoutes(s)).toBe(selectTrackRoutes(s))
  })
})
