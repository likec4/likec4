import { type LabelRoute, type Segment, polylineToSegments } from '@likec4/core/geometry'
import type { EdgeRouting } from '@likec4/core/types'
import { edgeEndFromNode } from '../utils/edge-endpoints'
import { drawnFromRoute, editedEdgePath, editedEdgeRoute, layoutedEdgeRoute } from '../utils/edge-path'
import { type TrackRoute, keepOwnTrack } from '../utils/edge-tracks'
import { type XYStoreState, useXYStore } from './useXYFlow'

const none: ReadonlyMap<string, TrackRoute> = new Map()
const cache = new WeakMap<
  XYStoreState['edges'],
  { nodes: XYStoreState['nodes']; routes: ReadonlyMap<string, TrackRoute> }
>()

/**
 * Returns relationship routes by edge identifier before track separation.
 *
 * Edited routes follow their control points and can move between tracks. Unedited routes
 * retain their Graphviz positions. Excludes edited self-loops, which use a separate path.
 * Caches results by the store's `edges` and `nodes` arrays.
 */
export function selectTrackRoutes(state: XYStoreState): ReadonlyMap<string, TrackRoute> {
  const cached = cache.get(state.edges)
  if (cached && cached.nodes === state.nodes) {
    return cached.routes
  }
  const routes = new Map<string, TrackRoute>()
  for (const edge of state.edges) {
    if (edge.type !== 'relationship') {
      continue
    }
    const source = edgeEndFromNode(state.nodeLookup.get(edge.source), 'source')
    const target = edgeEndFromNode(state.nodeLookup.get(edge.target), 'target')
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

/**
 * Returns visible orthogonal routes and labels after track separation.
 *
 * Includes edited self-loops and excludes hidden edges. Marks manually positioned labels as fixed.
 */
export function selectLabelRoutes(state: XYStoreState): LabelRoute[] {
  const trackRoutes = selectTrackRoutes(state)
  const others = [...trackRoutes.values()]
  return state.edges.flatMap((edge): LabelRoute[] => {
    if (edge.type !== 'relationship' || edge.hidden) {
      return []
    }
    const route = trackRoutes.get(edge.id)
    let segments: ReadonlyArray<Segment>
    if (route) {
      segments = route.movable
        ? drawnFromRoute(keepOwnTrack(route, others)).segments
        : polylineToSegments(route.points)
    } else {
      const source = edgeEndFromNode(state.nodeLookup.get(edge.source), 'source')
      const target = edgeEndFromNode(state.nodeLookup.get(edge.target), 'target')
      if (!source || !target || !edge.data.controlPoints) {
        return []
      }
      segments = editedEdgePath({
        source,
        target,
        dir: edge.data.dir,
        controlPoints: edge.data.controlPoints,
        routing: 'ortho',
      }).segments
    }
    return [{ id: edge.id, segments, labelBBox: edge.data.labelBBox ?? null, fixed: !!edge.data.isLabelCustomized }]
  })
}

const selectNone = () => none

/**
 * Returns the view's relationship routes when orthogonal track separation is enabled.
 *
 * Returns an empty map without subscribing to route changes for spline routing or when disabled.
 */
export function useTrackRoutes(routing: EdgeRouting, enabled: boolean): ReadonlyMap<string, TrackRoute> {
  return useXYStore(enabled && routing === 'ortho' ? selectTrackRoutes : selectNone)
}
