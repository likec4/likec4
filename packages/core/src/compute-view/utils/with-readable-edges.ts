import { map, mapToObj, mapValues, omit } from 'remeda'
import type { AnyAux, ComputedLikeC4ModelData } from '../../types'
import type { ComputedView, EdgeId } from '../../types/view'

/**
 * Convert hashed edge ids to human-readable
 * Mostly for testing purposes
 */
export function withReadableEdges<T extends ComputedView<any>>({ edges, nodes, ...view }: T, separator = ':'): T & {
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

export function viewsWithReadableEdges<A extends AnyAux>(
  { views, ...model }: ComputedLikeC4ModelData<A>,
): ComputedLikeC4ModelData<A> {
  return {
    ...model,
    views: mapValues(views as Record<string, ComputedView<A>>, v => omit(withReadableEdges(v), ['nodeIds', 'edgeIds'])),
  } as any
}
