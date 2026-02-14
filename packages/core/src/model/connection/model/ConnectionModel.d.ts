import type { AnyAux, aux, Unknown } from '../../../types';
import { customInspectSymbol } from '../../../utils/const';
import type { ElementModel } from '../../ElementModel';
import type { RelationshipModel } from '../../RelationModel';
import type { Connection } from '../Connection';
/**
 * Connection refers to any relationships between two elements,
 * both direct and implicit ones (between their nested elements).
 *
 * Merges relationships together to an single edge on the diagram.
 */
export declare class ConnectionModel<A extends AnyAux = Unknown> implements Connection<ElementModel<A>, aux.EdgeId> {
    readonly source: ElementModel<A>;
    readonly target: ElementModel<A>;
    readonly relations: ReadonlySet<RelationshipModel<A>>;
    readonly id: aux.EdgeId;
    constructor(source: ElementModel<A>, target: ElementModel<A>, relations?: ReadonlySet<RelationshipModel<A>>);
    private _boundary;
    /**
     * Common ancestor of the source and target elements.
     * Represents the boundary of the connection.
     */
    get boundary(): ElementModel<A> | null;
    /**
     * Human readable expression of the connection
     * Mostly used for testing and debugging
     */
    get expression(): string;
    /**
     * Returns true if only includes relations between the source and target elements.
     */
    get isDirect(): boolean;
    /**
     * Returns true if includes relations between nested elements of the source and target elements.
     */
    get isImplicit(): boolean;
    get directRelations(): ReadonlySet<RelationshipModel<A>>;
    nonEmpty(): boolean;
    mergeWith(other: ConnectionModel<A>): ConnectionModel<A>;
    difference(other: ConnectionModel<A>): ConnectionModel<A>;
    intersect(other: ConnectionModel<A>): ConnectionModel<A>;
    equals(other: Connection): boolean;
    /**
     * Returns a new instance with the updated relations.
     *
     * @param relations - A readonly set of `RelationshipModel` instances representing the new relations.
     * @returns A new `ConnectionModel` instance with the updated relations.
     */
    update(relations: ReadonlySet<RelationshipModel<A>>): ConnectionModel<A>;
    [customInspectSymbol](_depth: any, _inspectOptions: any, _inspect: any): string;
    toString(): string;
    /**
     * Creates a new connection with reversed direction (target becomes source and vice versa)
     */
    reversed(): ConnectionModel<A>;
}
