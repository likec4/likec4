import { pipe, prop, reduce } from 'remeda'
import type { RelationshipModel } from '../../model'
import {
  ConnectionModel,
  differenceConnections,
  findDeepestNestedConnection,
  findDescendantConnections,
  isAnyInOut,
  isIncoming,
  isOutgoing,
  mergeConnections,
} from '../../model'
import type { AnyAux } from '../../types'
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

// function isInOutToDescendant(id: string): (c: ConnectionModel) => boolean {
//   return anyPass([
//     allPass([
//       Connection.isOutgoing(id),
//       c => c.source.id !== id,
//     ]),
//     allPass([
//       Connection.isIncoming(id),
//       c => c.target.id !== id,
//     ]),
//   ])
// }

export function findRedundantConnections<A extends AnyAux>(
  connections: Iterable<ConnectionModel<A>>,
): Array<ConnectionModel<A>> {
  return pipe(
    [...connections],
    mergeConnections,
    reduce((reducedConnections, connection, _, all) => {
      const descendants = findDescendantConnections(all, connection)
      const nestedRelations = union(
        ...descendants.map(prop('relations')),
      )

      let accum = intersection(connection.relations, nestedRelations)

      if (descendants.length > 0) {
        accum = union(accum, connection.directRelations)
      }
      // Check if there is any reversed connection to descendant
      if (findDeepestNestedConnection(all, connection.reversed())) {
        accum = union(accum, connection.directRelations)
      }

      if (accum.size < connection.relations.size) {
        const isSourceExpanded = all.some(isAnyInOut(connection.source))
        const isTargetExpanded = all.some(isAnyInOut(connection.target))

        // Check if source expandaded
        if (isSourceExpanded) {
          accum = union(
            accum,
            toSet(
              ifilter(
                connection.relations,
                isOutgoing(connection.source),
              ),
            ),
          )
        }

        // Check if target expandaded
        if (isTargetExpanded) {
          accum = union(
            accum,
            toSet(
              ifilter(
                connection.relations,
                isIncoming(connection.target),
              ),
            ),
          )
        }
      }

      if (accum.size > 0) {
        reducedConnections.push(connection.update(accum))
      }

      return reducedConnections
    }, [] as ConnectionModel<A>[]),
  )
}

/**
 * Remove relationships from connection model, that are already included in the connections between descendants.
 * In other words - if there is same connection down the hierarchy.
 *
 * @returns New connection without redundant relationships
 *          Connection may be empty if all relationships are redundant, in this case it should be removed
 */
export function cleanRedundantRelationships<A extends AnyAux>(
  connections: Iterable<ConnectionModel<A>>,
): Array<ConnectionModel<A>> {
  return differenceConnections(
    connections,
    findRedundantConnections(connections),
  )
}
