import { filter, hasAtLeast, only } from 'remeda'
import type { ConnectionModel } from '../../model'
import {
  type AnyAux,
  type ComputedEdge,
  type ComputedNode,
  type scalar,
} from '../../types'
import { invariant } from '../../utils'
import { buildComputedNodes, elementModelToNodeSource } from '../utils/buildComputedNodes'
import { mergePropsFromRelationships } from '../utils/merge-props-from-relationships'
import type { Memory } from './_types'

export const NoWhere = () => true
export const NoFilter = <T>(x: T[] | readonly T[]): T[] => x as T[]

export function toComputedEdges<A extends AnyAux>(
  connections: ReadonlyArray<ConnectionModel<A>>,
): ComputedEdge<A>[] {
  return connections.reduce((acc, e) => {
    // const modelRelations = []
    // const deploymentRelations = []
    const relations = [
      ...e.relations,
    ]
    invariant(hasAtLeast(relations, 1), 'Edge must have at least one relation')

    const source = e.source.id
    const target = e.target.id

    const {
      title,
      ...props
    } = mergePropsFromRelationships(
      relations.map(r => r.$relationship),
      // Prefer only single relationship
      // https://github.com/likec4/likec4/issues/1423
      only(
        filter(relations, r => r.source.id === source && r.target.id === target),
      )?.$relationship,
    )

    const edge: ComputedEdge<A> = {
      id: e.id,
      parent: e.boundary?.id as scalar.NodeId ?? null,
      source: source as scalar.NodeId,
      target: target as scalar.NodeId,
      label: title ?? null,
      relations: relations.map((r) => r.id),
      ...props,
    }

    acc.push(edge)
    return acc
  }, [] as ComputedEdge<A>[])
}

export function buildNodes<A extends AnyAux>(
  memory: Memory,
): ReadonlyMap<scalar.NodeId, ComputedNode<A>> {
  return buildComputedNodes(
    [...memory.final].map(elementModelToNodeSource),
    memory.groups,
  )
}
