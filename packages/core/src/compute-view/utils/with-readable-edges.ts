import { map, mapToObj, mapValues, omit } from 'remeda'
import type { ComputedLikeC4ModelData } from '../../types'
import type { ComputedView, EdgeId } from '../../types/view'

/**
 * Convert hashed edge ids to human-readable
 * Mostly for testing purposes
 */
export function withReadableEdges<T extends ComputedView>({ edges, nodes, ...view }: T, separator = ':'): T & {
  nodeIds: string[]
  edgeIds: string[]
} {
  const edgeids = mapToObj(edges, e => [e.id, `${e.source}${separator}${e.target}` as EdgeId])

  return {
    ...view,
    edges: edges.map(e => ({
      ...e,
      id: edgeids[e.id]!,
    })),
    nodes: nodes.map(n => ({
      ...n,
      inEdges: map(n.inEdges, e => edgeids[e]!),
      outEdges: map(n.outEdges, e => edgeids[e]!),
    })),
    nodeIds: nodes.map(n => n.id),
    edgeIds: edges.map(e => edgeids[e.id]!),
  } as any
}

export function viewsWithReadableEdges<M extends ComputedLikeC4ModelData>({ views, ...model }: M): M {
  return {
    ...model,
    views: mapValues(views, v => omit(withReadableEdges(v), ['nodeIds', 'edgeIds'])),
  } as any
}
