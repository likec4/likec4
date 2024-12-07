import { map, mapToObj, mapValues } from 'remeda'
import type { ComputedLikeC4Model } from '../../types'
import type { ComputedView, EdgeId } from '../../types/view'

/**
 * Convert hashed edge ids to human-readable
 * Mostly for testing purposes
 */
export function withReadableEdges<T extends ComputedView>({ edges, nodes, ...view }: T): T {
  const edgeids = mapToObj(edges, e => [e.id, `${e.source}:${e.target}` as EdgeId])

  return {
    ...view,
    edges: edges.map(e => ({
      ...e,
      id: edgeids[e.id]!
    })),
    nodes: nodes.map(n => ({
      ...n,
      inEdges: map(n.inEdges, e => edgeids[e]!),
      outEdges: map(n.outEdges, e => edgeids[e]!)
    }))
  } as T
}

export function viewsWithReadableEdges<M extends ComputedLikeC4Model>({ views, ...model }: M): M {
  return {
    ...model,
    views: mapValues(views, withReadableEdges)
  } as M
}
