import type { RelationshipModel } from '../../model';
import { ConnectionModel } from '../../model';
import type { AnyAux } from '../../types';
export declare function allRelationshipsFrom(connections: Iterable<ConnectionModel>): Set<RelationshipModel>;
export declare function findRedundantConnections<A extends AnyAux>(connections: Iterable<ConnectionModel<A>>): Array<ConnectionModel<A>>;
/**
 * Remove relationships from connection model, that are already included in the connections between descendants.
 * In other words - if there is same connection down the hierarchy.
 *
 * @returns New connection without redundant relationships
 *          Connection may be empty if all relationships are redundant, in this case it should be removed
 */
export declare function cleanRedundantRelationships<A extends AnyAux>(connections: Iterable<ConnectionModel<A>>): Array<ConnectionModel<A>>;
