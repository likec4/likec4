import { dropWhile, filter, flatMap, forEach, forEachObj, groupBy, hasAtLeast, map, pipe, prop, sort } from 'remeda'
import { mergeConnections } from '../../model/connection/deployment'
import { DeploymentConnectionModel } from '../../model/connection/DeploymentConnectionModel'
import { RelationshipsAccum } from '../../model/DeploymentElementModel'
import type { RelationshipModel } from '../../model/RelationModel'
import type { AnyAux } from '../../model/types'
import { compareFqnHierarchically, getOrCreate, isAncestor } from '../../utils'
import type { Connections, Elem } from './_types'
import { type Patch } from './Memory'

const filterEmptyConnection = filter((c: DeploymentConnectionModel<any>) => c.size > 0)

function cleanCrossBoundary<M extends AnyAux>(connections: Connections<M>): Connections<M> {
  // Keep only connections between leafs
  // Also find connections based on same relation
  const groupedByRelation = new Map<RelationshipModel<M>, Array<DeploymentConnectionModel<M>>>()
  for (const conn of connections) {
    for (const relation of conn.relations.model) {
      getOrCreate(groupedByRelation, relation, () => []).push(conn)
    }
  }

  // DeploymentConnectionModel is immutables
  // So we create new instances without excluded relations
  const excludedRelations = new Map<DeploymentConnectionModel<M>, Set<RelationshipModel<M>>>()

  // In each group, find connected to same leaf
  for (const [relation, sameRelationGroup] of groupedByRelation) {
    if (!hasAtLeast(sameRelationGroup, 2)) {
      continue
    }

    // Outgoing from same source
    pipe(
      sameRelationGroup,
      flatMap(conn => [
        { group: `$source-${conn.source.id}`, conn },
        { group: `$target-${conn.target.id}`, conn }
      ]),
      groupBy(prop('group')),
      forEachObj((connections) => {
        if (connections.length < 2) {
          return
        }
        pipe(
          connections,
          map(prop('conn')),
          // Sort by hierarchy, first are deepest
          sort((a, b) => compareFqnHierarchically(a.boundary?.id ?? '$$', b.boundary?.id ?? '$$') * -1),
          // Skip connections in same deployment node
          dropWhile((conn, i, all) => i === 0 || conn.boundary === all[i - 1]!.boundary),
          // Clean relations from the rest
          forEach((conn) => {
            getOrCreate(excludedRelations, conn, () => new Set()).add(relation)
          })
        )
      })
    )
  }

  return pipe(
    connections,
    map(conn => {
      const excluded = excludedRelations.get(conn)
      if (excluded && excluded.size > 0) {
        const updated = new DeploymentConnectionModel(
          conn.source,
          conn.target,
          new RelationshipsAccum(
            conn.relations.model.difference(excluded),
            conn.relations.deployment
          )
        )
        return updated
      }
      return conn
    })
  )
}

/**
 * Remove relationships from connection model, that are already included in the connections between descendants.
 * In other words - if there is same connection down the hierarchy.
 *
 * @returns New connection without redundant relationships
 *          Connection may be empty if all relationships are redundant, in this case it should be removed
 */
const excludeRedundantRelationships: <M extends AnyAux>(connections: Connections<M>) => Connections<M> = map(
  (connection, _, connections) => {
    const { source, target } = connection

    // Connection between instances is always explicit
    if (source.isInstance() && target.isInstance()) {
      return connection
    }

    let modelRelations = connection.relations.model
    let deploymentRelations = connection.relations.deployment

    let hasChanged = false
    for (const c of connections) {
      if (
        isAncestor(source.id, c.source.id) && isAncestor(target.id, c.target.id)
        || isAncestor(source.id, c.source.id) && c.target.id === target.id
        || isAncestor(target.id, c.target.id) && c.source.id === source.id
      ) {
        modelRelations = modelRelations.difference(c.relations.model)
        deploymentRelations = deploymentRelations.difference(c.relations.deployment)
        hasChanged = true
      }
    }

    if (!hasChanged) {
      return connection
    }

    return new DeploymentConnectionModel(
      source,
      target,
      new RelationshipsAccum(
        modelRelations,
        deploymentRelations
      )
    )
  }
)

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

  const leafs = new Set<Elem>()

  for (const element of memory.elements) {
    // Instance is always leaf
    if (element.isInstance()) {
      leafs.add(element)
      continue
    }
    // Check if element is ancestor of any element in finalElements
    let hasChild = false
    for (const el of memory.elements) {
      if (isAncestor(element.id, el.id)) {
        hasChild = true
        break
      }
    }
    if (!hasChild) {
      leafs.add(element)
    }
  }

  const connectedElements = new Set<Elem>()

  const connections = pipe(
    memory.connections,
    mergeConnections,
    // Keep connections
    // - between leafs
    // - has direct deployment relation
    filter(c => {
      return (leafs.has(c.source) && leafs.has(c.target)) || c.hasDirectDeploymentRelation()
    }),
    cleanCrossBoundary,
    filterEmptyConnection,
    excludeRedundantRelationships,
    filterEmptyConnection,
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

  // Iterate over final elements (preserving order) and pick:
  // - explicitly included
  // - connected elements
  // - ancestors of connected elements
  const finalElements = new Set<Elem>()
  for (const el of newMemory.finalElements) {
    if (
      memory.isExplicit(el)
      || connectedElements.has(el)
      || isAncestorOfConnected(el)
    ) {
      finalElements.add(el)
    }
  }
  newMemory.finalElements = finalElements

  return newMemory
}
