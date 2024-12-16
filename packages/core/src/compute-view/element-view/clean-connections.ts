import { forEach, pipe } from 'remeda'
import { isNestedConnection, sortDeepestFirst } from '../../model/connection'
import { ConnectionModel, mergeConnections } from '../../model/connection/model'
import type { RelationshipModel } from '../../model/RelationModel'
import type { Fqn } from '../../types'
import type { Elem } from './_types'
import { Memory } from './memory'

export function allRelationshipsFrom(connections: Iterable<ConnectionModel>): Set<RelationshipModel> {
  const relations = new Set<RelationshipModel>()
  for (const c of connections) {
    for (const rel of c.relations) {
      relations.add(rel)
    }
  }
  return relations
}

/**
 * Remove relationships from connection model, that are already included in the connections between descendants.
 * In other words - if there is same connection down the hierarchy.
 *
 * @returns New connection without redundant relationships
 *          Connection may be empty if all relationships are redundant, in this case it should be removed
 */
function excludeRedundantRelationships(
  connections: ReadonlyArray<ConnectionModel>
): Array<ConnectionModel> {
  const processedRelations = new Set<RelationshipModel>()

  // Returns relations, that are not processed/included
  const excludeProcessed = (relations: ReadonlySet<RelationshipModel>) =>
    new Set(
      [...relations].reduce((acc, rel) => {
        if (!processedRelations.has(rel)) {
          acc.push(rel)
          processedRelations.add(rel)
        }
        return acc
      }, [] as RelationshipModel[])
    )

  return sortDeepestFirst(connections)
    .map(connection => {
      const relations = excludeProcessed(connection.relations)

      // If there is only one relation left, but there were more before
      // we imply that there were nested connections
      if (relations.size == 1 && relations.size !== connection.relations.size) {
        const relation = [...relations][0]!
        if (connection.source === relation.source && connection.target === relation.target) {
          // There are nested connections, assume there are more detailed relations
          relations.clear()
        }
      }
      if (relations.size !== connection.relations.size) {
        return connection.updateRelations(relations)
      } else {
        return connection
      }
    })
    .filter(c => c.nonEmpty())
    .filter((c, _, all) => {
      // Remove connections if there is any descendant
      if (all.some(other => isNestedConnection(other, c))) {
        return false
      }
      const reversed = new ConnectionModel(c.target, c.source, c.relations)
      return !all.some(other => isNestedConnection(other, reversed))
    })
  // .reverse()

  // // We keep order of connections
  // return connections.reduce((acc, connection) => {
  //   const reduced = reducedConnections.get(connection.id)
  //   if (reduced && reduced.nonEmpty()) {
  //     acc.push(reduced)
  //   }
  //   return acc
  // }, [] as Connection[])
}
/**
 * This patch:
 * 1. Keeps connections between leafs or having direct deployment relations
 * 2. Removes cross-boundary model relations, that already exist inside boundaries
 *    (e.g. prefer relations inside same deployment node over relations between nodes)
 * 3. Removes implicit connections between elements, if their descendants have same connection
 */
export const cleanConnections = (memory: Memory) => {
  if (memory.connections.length < 2) {
    return memory
  }

  const connectedElements = new Set<Elem>()
  const parentsOfConnected = new Set<Fqn>()

  const connections = pipe(
    memory.connections,
    mergeConnections,
    excludeRedundantRelationships,
    forEach((c) => {
      connectedElements.add(c.source)
      connectedElements.add(c.target)
      if (c.source.parent) {
        parentsOfConnected.add(c.source.parent.id)
      }
      if (c.target.parent) {
        parentsOfConnected.add(c.target.parent.id)
      }
    })
  )

  const isParentOfConnected = (el: Elem) => parentsOfConnected.has(el.id)

  // Update memory
  const state = memory.mutableState()
  state.connections = connections

  // Iterate over elements (preserving order) and pick:
  // - explicitly included
  // - connected elements
  // - ancestors of connected elements
  const finalElements = new Set<Elem>()
  for (const el of state.final) {
    if (
      state.explicits.has(el)
      || connectedElements.has(el)
      || isParentOfConnected(el)
    ) {
      finalElements.add(el)
    }
  }
  state.final = finalElements
  return memory.update(state)
}
