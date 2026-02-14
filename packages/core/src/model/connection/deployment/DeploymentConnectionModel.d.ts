import type { AnyAux, aux, IteratorLike } from '../../../types';
import { customInspectSymbol } from '../../../utils/const';
import { type DeploymentElementModel, type DeploymentRelationModel, DeploymentNodeModel, RelationshipsAccum } from '../../DeploymentElementModel';
import type { RelationshipModel } from '../../RelationModel';
import type { Connection } from '../Connection';
/**
 * Connection is ephemeral entity, result of a resolving relationships between source and target.
 * Includes direct relationships and/or between their nested elements.
 */
export declare class DeploymentConnectionModel<A extends AnyAux = AnyAux> implements Connection<DeploymentElementModel<A>, aux.EdgeId> {
    readonly source: DeploymentElementModel<A>;
    readonly target: DeploymentElementModel<A>;
    readonly relations: RelationshipsAccum<A>;
    readonly id: aux.EdgeId;
    constructor(source: DeploymentElementModel<A>, target: DeploymentElementModel<A>, relations: RelationshipsAccum<A>);
    /**
     * Human readable expression of the connection
     * Mostly used for testing and debugging
     */
    get expression(): string;
    private _boundary;
    /**
     * Common ancestor of the source and target elements.
     * Represents the boundary of the connection.
     */
    get boundary(): DeploymentNodeModel<A> | null;
    nonEmpty(): boolean;
    [customInspectSymbol](_depth: any, _inspectOptions: any, _inspect: any): string;
    toString(): string;
    /**
     * Check if connection contains deployment relation,
     * that is directly connected to source or target.
     */
    hasDirectDeploymentRelation(): boolean;
    values(): IteratorLike<RelationshipModel<A> | DeploymentRelationModel<A>>;
    /**
     * Merge with another connections, if it has the same source and target.
     * Returns new connection with union of relationships.
     */
    mergeWith(others: DeploymentConnectionModel<A>[]): DeploymentConnectionModel<A>;
    /**
     * Merge with another connection, if it has the same source and target.
     * Returns new connection with union of relationships.
     */
    mergeWith(other: DeploymentConnectionModel<A>): DeploymentConnectionModel<A>;
    difference(other: DeploymentConnectionModel<A>): DeploymentConnectionModel<A>;
    intersect(other: DeploymentConnectionModel<A>): DeploymentConnectionModel<A>;
    equals(other: Connection): boolean;
    /**
     * Creates a clone of the current `DeploymentConnectionModel` instance with optional overrides.
     * if `null` is provided in overrides, the corresponding relation set will be empty.
     */
    update(overrides?: {
        model?: ReadonlySet<RelationshipModel<A>> | null;
        deployment?: ReadonlySet<DeploymentRelationModel<A>> | null;
    }): DeploymentConnectionModel<A>;
}
