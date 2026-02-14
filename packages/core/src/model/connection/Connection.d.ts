import type { AnyAux, Fqn } from '../../types';
import type { DeploymentElementModel } from '../DeploymentElementModel';
import type { ElementModel } from '../ElementModel';
export interface Connection<Elem = ElementModel<AnyAux> | DeploymentElementModel<AnyAux>, Id = string> {
    readonly id: Id;
    readonly source: Elem;
    readonly target: Elem;
    /**
     * Common ancestor of the source and target elements.
     * Represents the boundary of the connection.
     */
    readonly boundary: Elem | null;
    /**
     * Human readable expression of the connection
     * Mostly used for testing and debugging
     */
    readonly expression: string;
    mergeWith(this: Connection<Elem, Id>, other: typeof this): typeof this;
    nonEmpty(): boolean;
    difference(this: Connection<Elem, Id>, other: typeof this): typeof this;
    intersect(this: Connection<Elem, Id>, other: typeof this): typeof this;
    equals(other: Connection): boolean;
}
export declare namespace Connection {
    type ConnectionPredicate = <C extends Connection<{
        id: string;
    }, any>>(connection: C) => boolean;
    type ElementId = Fqn | string;
    export const isInside: (fqn: ElementId) => ConnectionPredicate;
    export const isDirectedBetween: (source: ElementId, target: ElementId) => ConnectionPredicate;
    export const isAnyBetween: (source: ElementId, target: ElementId) => ConnectionPredicate;
    export const isIncoming: (target: ElementId) => ConnectionPredicate;
    export const isOutgoing: (source: ElementId) => ConnectionPredicate;
    export const isAnyInOut: (source: ElementId) => ConnectionPredicate;
    export {};
}
