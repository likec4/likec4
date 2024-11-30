import { dropWhile, flatMap, forEach, forEachObj, groupBy, hasAtLeast, map, pipe, prop, sort } from 'remeda'
import { DeploymentConnectionModel } from '../../model/DeploymentConnectionModel'
import { RelationshipsAccum } from '../../model/DeploymentElementModel'
import type { RelationshipModel } from '../../model/RelationModel'
import type { AnyAux } from '../../model/types'
import { compareFqnHierarchically, getOrCreate } from '../../utils'
import type { Connections } from './_types'

export function cleanCrossBoundaryConnections<M extends AnyAux>(connections: Connections<M>): Connections<M> {
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

  return flatMap(connections, conn => {
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
      return updated.relations.nonEmpty ? [updated] : []
    }
    return conn
  })
}
