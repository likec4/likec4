import { DefaultMap } from 'mnemonist'
import {
  dropWhile,
  filter,
  flatMap,
  forEach,
  groupBy,
  hasAtLeast,
  map,
  pipe,
  piped,
  prop,
  reduce,
  values,
} from 'remeda'
import { invariant } from '../../errors'
import {
  DeploymentConnectionModel,
  differenceConnections,
  isNestedConnection,
  mergeConnections,
  sortConnectionsByBoundaryHierarchy,
} from '../../model/connection'
import { findConnection } from '../../model/connection/deployment'
import { RelationshipsAccum } from '../../model/DeploymentElementModel'
import type { RelationshipModel } from '../../model/RelationModel'
import { imap, toArray } from '../../utils/iterable'
import { intersection, union } from '../../utils/set'
import type { Connection, Connections } from './_types'

const filterEmptyConnection = filter((c: DeploymentConnectionModel<any>) => c.nonEmpty())

type MapOfExcludesFromConnection = DefaultMap<DeploymentConnectionModel, Set<RelationshipModel>>
function findCrossBoundarySameSourceOrTarget(connections: Connections): MapOfExcludesFromConnection {
  // Also find connections based on same relation
  const groupedByRelation = new DefaultMap<RelationshipModel, Array<DeploymentConnectionModel>>(() => [])
  for (const conn of connections) {
    for (const relation of conn.relations.model) {
      groupedByRelation.get(relation).push(conn)
    }
  }

  // Aggreate excluded relations for each connection
  const excludedRelations = new DefaultMap<
    DeploymentConnectionModel,
    Set<RelationshipModel>
  >(() => new Set())

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
        { group: `$target-${conn.target.id}`, conn },
      ]),
      groupBy(prop('group')),
      values(),
      filter(hasAtLeast(2)),
      forEach(
        // In each group, sort by hierarchy, first are deepest
        piped(
          map(prop('conn')),
          sortConnectionsByBoundaryHierarchy('desc'),
          // Drop first, as it is the deepest
          // Drop if boundary is same as previous
          dropWhile((conn, i, all) => i === 0 || conn.boundary === all[i - 1]!.boundary),
          // Drop relations from boundaries above
          forEach((conn) => {
            excludedRelations.get(conn).add(relation)
          }),
        ),
      ),
    )
  }

  return excludedRelations
}

/**
 * Identifies and processes cross-boundary connections in a deployment diagram.
 * This function analyzes connections between nodes and removes redundant relations
 * when multiple connections exist between the same elements across different boundaries.
 *
 * The function performs the following:
 * 1. Groups connections by their relationship type
 * 2. For each relationship group, identifies connections that:
 *    - Share the same source
 *    - Share the same target
 * 3. When multiple connections are found in the same group, keeps only the most specific
 *    (deepest in hierarchy) connection and removes the relationship from others
 *
 * @param connections - The input collection of deployment connections to analyze
 * @returns connections with redundant cross-boundary relationships
 */
export function findCrossBoundaryConnections(connections: Connections): Array<Connection> {
  // Ensure connections are merged
  connections = mergeConnections(connections)

  const excludedRelations = findCrossBoundarySameSourceOrTarget(connections)

  for (const c of connections) {
    const { source, target } = c
    const connectionModelRelations = c.relations.model
    // Connections between node and instance
    // Exclude internal relations of the node (otherwise they are cross-boundary)
    if (source.isDeploymentNode() !== target.isDeploymentNode()) {
      const node = source.isDeploymentNode() ? source : c.target
      invariant(node.isDeploymentNode())
      const nodeInternals = node.internalModelRelationships()
      const toExclude = intersection(
        connectionModelRelations,
        nodeInternals,
      )
      for (const relation of toExclude) {
        excludedRelations.get(c).add(relation)
      }

      continue
    }

    // Connection between nodes
    if (source.isDeploymentNode() && target.isDeploymentNode()) {
      const toExclude = union(
        // Exclude node internals (otherwise thay are cross-boundary)
        intersection(
          c.relations.model,
          source.internalModelRelationships(),
        ),
        intersection(
          c.relations.model,
          target.internalModelRelationships(),
        ),
      )
      for (const relation of toExclude) {
        excludedRelations.get(c).add(relation)
      }
    }
  }

  return pipe(
    excludedRelations.entries(),
    imap(([c, excluded]) =>
      c.update({
        model: excluded,
        deployment: null,
      })
    ),
    toArray(),
  )
}

/**
 * Cleans connections that cross boundaries by removing overlapping parts.
 * @example
 * ```ts
 * const connections = getConnections();
 * const cleanedConnections = cleanCrossBoundary(connections);
 * ```
 */
export function cleanCrossBoundary(connections: Connections): Array<Connection> {
  return differenceConnections(
    connections,
    findCrossBoundaryConnections(connections),
  )
}

/**
 * Identifies and returns redundant connections in a deployment view.
 * A connection is considered redundant if its relationships are already implied
 * through other connections
 *
 * @returns Array of redundant connections that can be safely removed
 */
export function findRedundantConnections(connections: Connections): Array<Connection> {
  return pipe(
    connections,
    mergeConnections,
    reduce((redundants, connection) => {
      const { source, target, relations } = connection

      // Connection between instances is always explicit
      if (source.isInstance() && target.isInstance()) {
        return redundants
      }

      let redundantAccum = RelationshipsAccum.empty()

      if (source.isDeploymentNode() && target.isDeploymentNode()) {
        const [reversed] = findConnection(target, source, 'directed')
        if (reversed) {
          redundantAccum = relations.intersect(reversed.relations)
        }
      }

      for (const c of connections) {
        if (isNestedConnection(c, connection)) {
          redundantAccum = redundantAccum.union(
            relations.intersect(c.relations),
          )
        }
      }

      if (redundantAccum.nonEmpty) {
        redundants.push(
          new DeploymentConnectionModel(
            source,
            target,
            redundantAccum,
          ),
        )
      }

      return redundants
    }, [] as DeploymentConnectionModel[]),
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
  connections: Connections,
): Array<Connection> {
  return differenceConnections(
    connections,
    findRedundantConnections(connections),
  )
}
