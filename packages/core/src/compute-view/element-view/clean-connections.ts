import { allPass, anyPass, pipe, reduce } from 'remeda'
import {
  ConnectionModel,
  differenceConnections,
  hasSameSource,
  hasSameTarget,
  isNestedConnection,
  mergeConnections,
  sortDeepestFirst,
} from '../../model/connection'
import type { RelationshipModel } from '../../model/RelationModel'
import { intersection, union } from '../../utils'
import { ifilter, toSet } from '../../utils/iterable'

export function allRelationshipsFrom(connections: Iterable<ConnectionModel>): Set<RelationshipModel> {
  const relations = new Set<RelationshipModel>()
  for (const c of connections) {
    for (const rel of c.relations) {
      relations.add(rel)
    }
  }
  return relations
}

export function findRedundantConnections(connections: Iterable<ConnectionModel>): Array<ConnectionModel> {
  let seenRelations = new Set<RelationshipModel>()
  return pipe(
    [...connections],
    mergeConnections,
    sortDeepestFirst,
    reduce((reducedConnections, connection, _, all) => {
      let accum = intersection(connection.relations, seenRelations)
      seenRelations = union(seenRelations, connection.relations)

      if (accum.size < connection.relations.size) {
        const isNestedOrReverse = anyPass([
          isNestedConnection(connection),
          isNestedConnection(connection.reversed(false)),
        ])
        if (all.some(isNestedOrReverse)) {
          accum = union(
            accum,
            connection.directRelations,
            toSet(
              ifilter(
                connection.relations,
                allPass([
                  isNestedOrReverse,
                  anyPass([
                    hasSameSource(connection),
                    hasSameTarget(connection),
                  ]),
                ]),
              ),
            ),
          )
        }
      }

      if (accum.size > 0) {
        reducedConnections.push(connection.update(accum))
      }

      return reducedConnections
    }, [] as ConnectionModel[]),
  )
}

/**
 * Remove relationships from connection model, that are already included in the connections between descendants.
 * In other words - if there is same connection down the hierarchy.
 *
 * @returns New connection without redundant relationships
 *          Connection may be empty if all relationships are redundant, in this case it should be removed
 */
export function cleanRedundantRelationships(
  connections: Iterable<ConnectionModel>,
): Array<ConnectionModel> {
  return differenceConnections(
    connections,
    findRedundantConnections(connections),
  )
}
