import type { EdgeRouting } from '@likec4/core/types'
import { editedEdgeRoute, layoutedEdgeRoute } from '../utils/edge-path'
import type { TrackRoute } from '../utils/edge-tracks'
import { nodeToRect } from '../utils/xyflow'
import { type XYStoreState, useXYStore } from './useXYFlow'

const none: ReadonlyMap<string, TrackRoute> = new Map()
const cache = new WeakMap<
  XYStoreState['edges'],
  { nodes: XYStoreState['nodes']; routes: ReadonlyMap<string, TrackRoute> }
>()

/**
 * Routes of every relationship edge of an ortho view, by edge id, as drawn from the store data:
 * edited edges through their corners (movable), untouched edges along their Graphviz corners (fixed).
 * Cached per `edges` and `nodes` arrays, which the store replaces whenever an edge or a node changes.
 */
export function selectTrackRoutes(state: XYStoreState): ReadonlyMap<string, TrackRoute> {
  const cached = cache.get(state.edges)
  if (cached && cached.nodes === state.nodes) {
    return cached.routes
  }
  const routes = new Map<string, TrackRoute>()
  // the centre an edge is drawn from is the handle position xyflow reports to the edge, not the box centre
  const end = (id: string, handle: 'source' | 'target') => {
    const node = state.nodeLookup.get(id)
    if (!node) {
      return null
    }
    const rect = nodeToRect(node)
    const bounds = node.internals.handleBounds?.[handle]?.[0]
    const center = bounds
      ? { x: Math.trunc(rect.x + bounds.x + bounds.width / 2), y: Math.trunc(rect.y + bounds.y + bounds.height / 2) }
      : { x: Math.trunc(rect.x + rect.width / 2), y: Math.trunc(rect.y + rect.height / 2) }
    return { center, node: rect }
  }
  for (const edge of state.edges) {
    if (edge.type !== 'relationship') {
      continue
    }
    const source = end(edge.source, 'source'), target = end(edge.target, 'target')
    if (!source || !target) {
      continue
    }
    const endpoints = { source, target, dir: edge.data.dir }
    const controlPoints = edge.data.controlPoints
    if (controlPoints) {
      const route = editedEdgeRoute({ ...endpoints, controlPoints })
      if (route) {
        routes.set(edge.id, { id: edge.id, movable: true, ...route })
      }
    } else {
      routes.set(edge.id, {
        id: edge.id,
        points: layoutedEdgeRoute({ ...endpoints, points: edge.data.points }),
        movable: false,
      })
    }
  }
  cache.set(state.edges, { nodes: state.nodes, routes })
  return routes
}

const selectNone = () => none

/**
 * Routes of the other edges of the view, for keeping an edge on its own track.
 * Empty, and not subscribed to, under spline routing or when the edge is untouched.
 */
export function useTrackRoutes(routing: EdgeRouting, enabled: boolean): ReadonlyMap<string, TrackRoute> {
  return useXYStore(enabled && routing === 'ortho' ? selectTrackRoutes : selectNone)
}
