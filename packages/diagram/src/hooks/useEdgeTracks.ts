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
 * Relationship routes by edge id before track separation: edited routes may move, unedited ones keep
 * their Graphviz position. Cached per store `edges` and `nodes`.
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

/** Visible orthogonal routes and labels after track separation, including edited self-loops. */
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

/** Track routes for ortho routing when enabled; otherwise an empty map without subscribing. */
export function useTrackRoutes(routing: EdgeRouting, enabled: boolean): ReadonlyMap<string, TrackRoute> {
  return useXYStore(enabled && routing === 'ortho' ? selectTrackRoutes : selectNone)
}
