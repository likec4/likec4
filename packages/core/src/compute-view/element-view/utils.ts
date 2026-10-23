import { filter, hasAtLeast, only, partition, pipe } from 'remeda'
import type { ConnectionModel, LikeC4Model } from '../../model'
import {
  type AnyAux,
  type ComputedEdge,
  type ComputedNode,
  type scalar,
  exact,
} from '../../types'
import { invariant } from '../../utils'
import { stringHash } from '../../utils/string-hash'
import { buildComputedNodes, elementModelToNodeSource } from '../utils/buildComputedNodes'
import { computedEdgePropsFromRelationships } from '../utils/merge-props-from-relationships'
import type { ShouldExpandPredicate } from '../utils/relationExpressionToPredicates'
import type { Memory } from './_types'

export const NoWhere = () => true
export const NoFilter = <T>(x: T[] | readonly T[]): T[] => x as T[]

const hashEdgeId = (source: scalar.NodeId, target: scalar.NodeId, relId: scalar.RelationId): scalar.EdgeId =>
  stringHash(`model:${source}:${target}:${relId}`) as scalar.EdgeId

export function toComputedEdges<A extends AnyAux>(
  connections: ReadonlyArray<ConnectionModel<A>>,
  shouldExpand?: ShouldExpandPredicate,
): ComputedEdge<A>[] {
  return connections.flatMap((conn) => {
    // const modelRelations = []
    // const deploymentRelations = []
    const relations = [
      ...conn.relations,
    ]
    invariant(hasAtLeast(relations, 1), 'Edge must have at least one relation')

    const $defaults = conn.source.$model.$styles.defaults

    const source = conn.source.id
    const target = conn.target.id

    const directRelsList = filter(relations, r => r.source.id === source && r.target.id === target)

    if (shouldExpand && relations.length > 1) {
      const [expanded, merged] = pipe(
        relations,
        partition(r => shouldExpand(r, conn)),
      )

      if (expanded.length > 0) {
        const results: ComputedEdge<A>[] = expanded.map(rel => {
          return exact({
            id: hashEdgeId(source as scalar.NodeId, target as scalar.NodeId, rel.id),
            parent: conn.boundary?.id as scalar.NodeId ?? null,
            source: source as scalar.NodeId,
            target: target as scalar.NodeId,
            ...computedEdgePropsFromRelationships(
              [rel.$relationship],
              $defaults.relationship,
              rel.$relationship,
            ),
          })
        })

        if (merged.length > 0) {
          results.push(exact({
            id: conn.id,
            parent: conn.boundary?.id as scalar.NodeId ?? null,
            source: source as scalar.NodeId,
            target: target as scalar.NodeId,
            ...computedEdgePropsFromRelationships(
              merged.map(r => r.$relationship),
              $defaults.relationship,
              only(filter(merged, r => r.source.id === source && r.target.id === target))?.$relationship,
            ),
          }))
        }

        return results
      }
    }

    const edge: ComputedEdge<A> = exact({
      id: conn.id,
      parent: conn.boundary?.id as scalar.NodeId ?? null,
      source: source as scalar.NodeId,
      target: target as scalar.NodeId,
      ...computedEdgePropsFromRelationships(
        relations.map(r => r.$relationship),
        $defaults.relationship,
        // Prefer only single relationship
        // https://github.com/likec4/likec4/issues/1423
        only(directRelsList)?.$relationship,
      ),
    })

    return [edge]
  })
}

export function buildNodes<A extends AnyAux>(
  model: LikeC4Model<A>,
  memory: Memory,
): ReadonlyMap<scalar.NodeId, ComputedNode<A>> {
  return buildComputedNodes(
    model.$styles,
    [...memory.final].map(elementModelToNodeSource),
    memory.groups,
  )
}
