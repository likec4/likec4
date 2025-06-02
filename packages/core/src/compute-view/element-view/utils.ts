import { filter, hasAtLeast, only } from 'remeda'
import { invariant } from '../../errors'
import type { ConnectionModel, ElementModel } from '../../model'
import {
  type AnyAux,
  type ComputedEdge,
  type ComputedNode,
  type Element,
  type Unknown,
} from '../../types'
import { type ComputedNodeSource, buildComputedNodes } from '../utils/buildComputedNodes'
import { mergePropsFromRelationships } from '../utils/merge-props-from-relationships'
import type { Memory } from './_types'

export const NoWhere = () => true
export const NoFilter = <T>(x: T[] | readonly T[]): T[] => x as T[]

export function toNodeSource<A extends AnyAux>(el: ElementModel<any>): Omit<ComputedNodeSource<A>, 'id'> & {
  id: Aux.StrictFqn<A>
} {
  return {
    ...el.$element as Element<A>,
    modelRef: 1,
  }
}

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
      parent: e.boundary?.id ?? null,
      source: NodeId(source),
      target: NodeId(target),
      label: title ?? null,
      relations: relations.map((r) => r.id),
      ...props,
    }

    acc.push(edge)
    return acc
  }, [] as ComputedEdge<A>[])
}

export function buildNodes<A extends AnyAux = Unknown>(
  memory: Memory,
): ReadonlyMap<Aux.StrictFqn<A>, ComputedNode<A>> {
  return buildComputedNodes(
    [...memory.final].map(n => toNodeSource<A>(n)),
    memory.groups,
  )
}
