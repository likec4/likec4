import type { Connection, Connections } from './_types';
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
export declare function findCrossBoundaryConnections(connections: Connections): Array<Connection>;
/**
 * Cleans connections that cross boundaries by removing overlapping parts.
 * @example
 * ```ts
 * const connections = getConnections();
 * const cleanedConnections = cleanCrossBoundary(connections);
 * ```
 */
export declare function cleanCrossBoundary(connections: Connections): Array<Connection>;
/**
 * Identifies and returns redundant connections in a deployment view.
 * A connection is considered redundant if its relationships are already implied
 * through other connections
 *
 * @returns Array of redundant connections that can be safely removed
 */
export declare function findRedundantConnections(connections: Connections): Array<Connection>;
/**
 * Remove relationships from connection model, that are already included in the connections between descendants.
 * In other words - if there is same connection down the hierarchy.
 *
 * @returns New connection without redundant relationships
 *          Connection may be empty if all relationships are redundant, in this case it should be removed
 */
export declare function cleanRedundantRelationships(connections: Connections): Array<Connection>;
