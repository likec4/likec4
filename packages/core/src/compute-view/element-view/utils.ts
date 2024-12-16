import { hasAtLeast } from 'remeda'
import { invariant } from '../../errors'
import { type ComputedEdge, type ComputedNode, type Fqn } from '../../types'
import { buildComputedNodes, type ComputedNodeSource } from '../utils/buildComputedNodes'
import { mergePropsFromRelationships } from '../utils/merge-props-from-relationships'
import type { Connection, Elem, Memory } from './_types'

export const NoWhere = () => true
export const NoFilter = <T>(x: T[] | readonly T[]): T[] => x as T[]

export function toNodeSource(el: Elem): ComputedNodeSource {
  return {
    ...el.$element,
    modelRef: 1
  }
}

export function toComputedEdges(
  connections: ReadonlyArray<Connection>
): ComputedEdge[] {
  return connections.reduce((acc, e) => {
    // const modelRelations = []
    // const deploymentRelations = []
    const relations = [
      ...e.relations
    ]
    invariant(hasAtLeast(relations, 1), 'Edge must have at least one relation')

    const source = e.source.id
    const target = e.target.id

    const {
      title,
      ...props
    } = mergePropsFromRelationships(
      relations.map(r => r.$relationship),
      relations.find(r => r.source.id === source && r.target.id === target)?.$relationship
    )

    const edge: ComputedEdge = {
      id: e.id,
      parent: e.boundary?.id ?? null,
      source,
      target,
      label: title ?? null,
      relations: relations.map((r) => r.id),
      ...props
    }

    acc.push(edge)
    return acc
  }, [] as ComputedEdge[])
}

export function buildNodes(memory: Memory): ReadonlyMap<Fqn, ComputedNode> {
  // typecast to MutableMemory
  // invariant(memory instanceof MutableMemory, 'Expected MutableMemory')
  return buildComputedNodes([...memory.final].map(toNodeSource), memory.groups)
}
