import { filter, forEach, pipe } from 'remeda'
import { ConnectionModel } from '../../model/connection/ConnectionModel'
import { mergeConnections } from '../../model/connection/deployment'
import type { RelationshipModel } from '../../model/RelationModel'
import { isAncestor } from '../../utils'
import type { Connection, Elem, Patch } from './_types'

const filterEmptyConnection = filter((c: Connection) => c.nonEmpty())

export const isNestedConnection = (nested: Connection, parent: Connection) => {
  const isSameSource = nested.source === parent.source
  const isSameTarget = nested.target === parent.target
  if (isSameSource && isSameTarget) {
    return false
  }
  const isSourceNested = isAncestor(parent.source.id, nested.source.id)
  const isTargetNested = isAncestor(parent.target.id, nested.target.id)
  return (
    (isSourceNested && isTargetNested)
    || (isSameSource && isTargetNested)
    || (isSameTarget && isSourceNested)
  )
}

const findDeepestNestedConnection = (connections: ReadonlyArray<Connection>, connection: Connection) => {
  let deepest = connection
  for (const c of connections) {
    if (isNestedConnection(c, deepest)) {
      deepest = c
    }
  }
  return deepest !== connection ? deepest : null
}

const sortDeepestFirst = (connections: ReadonlyArray<Connection>) => {
  const sorted = [] as Connection[]
  const unsorted = connections.slice()
  let next
  while (next = unsorted.shift()) {
    let deepest
    while (deepest = findDeepestNestedConnection(unsorted, next)) {
      const index = unsorted.indexOf(deepest)
      sorted.push(unsorted.splice(index, 1)[0]!)
    }
    sorted.push(next)
  }
  return sorted
}

/**
 * Remove relationships from connection model, that are already included in the connections between descendants.
 * In other words - if there is same connection down the hierarchy.
 *
 * @returns New connection without redundant relationships
 *          Connection may be empty if all relationships are redundant, in this case it should be removed
 */
function excludeRedundantRelationships(
  connections: ReadonlyArray<Connection>
): Array<Connection> {
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

  const reducedConnections = sortDeepestFirst(connections)
    .reduce((acc, connection) => {
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
        acc.set(connection.id, new ConnectionModel(connection.source, connection.target, relations))
      } else {
        acc.set(connection.id, connection)
      }
      return acc
    }, new Map<string, ConnectionModel>())

  // We keep order of connections
  return connections.reduce((acc, connection) => {
    const reduced = reducedConnections.get(connection.id)
    if (reduced && reduced.nonEmpty()) {
      acc.push(reduced)
    }
    return acc
  }, [] as Connection[])
}
/**
 * This patch:
 * 1. Keeps connections between leafs or having direct deployment relations
 * 2. Removes cross-boundary model relations, that already exist inside boundaries
 *    (e.g. prefer relations inside same deployment node over relations between nodes)
 * 3. Removes implicit connections between elements, if their descendants have same connection
 */
export const cleanConnections: Patch = (memory) => {
  if (memory.connections.length < 2) {
    return memory
  }

  const connectedElements = new Set<Elem>()

  const connections = pipe(
    memory.connections,
    mergeConnections,
    excludeRedundantRelationships,
    forEach((c) => {
      connectedElements.add(c.source)
      connectedElements.add(c.target)
    })
  )

  const isAncestorOfConnected = (el: Elem) => {
    for (const connected of connectedElements) {
      if (isAncestor(el.id, connected.id)) {
        return true
      }
    }
    return false
  }

  // Update memory
  const newMemory = memory.clone()
  newMemory.connections = connections

  // Iterate over elements (preserving order) and pick:
  // - explicitly included
  // - connected elements
  // - ancestors of connected elements
  const finalElements = new Set<Elem>()
  for (const el of newMemory.finalElements) {
    if (
      newMemory.isExplicit(el)
      || connectedElements.has(el)
      || isAncestorOfConnected(el)
    ) {
      finalElements.add(el)
    }
  }
  newMemory.finalElements = finalElements
  return newMemory
}
