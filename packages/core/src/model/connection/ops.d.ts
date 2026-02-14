import type { IterableContainer, ReorderedArray } from '../../types';
import type { Connection } from './Connection';
/**
 * Check if connection is nested inside another connection
 * (i.e. between descendants)
 */
export declare function isNestedConnection<T extends {
    id: string;
}>(parent: WithSourceTarget<NoInfer<T>>): (nested: WithSourceTarget<T>) => boolean;
export declare function isNestedConnection<T extends {
    id: string;
}>(nested: WithSourceTarget<T>, parent: WithSourceTarget<T>): boolean;
type ConnectionElemId = Connection<{
    readonly id: string;
}, any>;
export declare function findDeepestNestedConnection<C extends ConnectionElemId>(connections: ReadonlyArray<C>, connection: C): C | null;
export declare function sortDeepestFirst<C extends ConnectionElemId>(connections: ReadonlyArray<C>): C[];
/**
 * To make {@link sortConnectionsByBoundaryHierarchy} work correctly we add '.' to boundary
 * Othwerwise connection without boundary will be considered same level as connection with top-level boundary
 */
export declare function boundaryHierarchy<C extends WithBoundary>(conn: C): string;
type WithBoundary = {
    id: string;
    boundary: null | {
        id: string;
    };
};
export declare function sortConnectionsByBoundaryHierarchy(sort?: 'asc' | 'desc'): <T extends WithBoundary, A extends IterableContainer<T>>(array: A) => ReorderedArray<A>;
export declare function sortConnectionsByBoundaryHierarchy<T extends WithBoundary, A extends IterableContainer<T>>(array: A, sort?: 'asc' | 'desc'): ReorderedArray<A>;
/**
 * Find connections that includes given connection (i.e between it's ancestors)
 */
export declare function findAscendingConnections<C extends ConnectionElemId>(connections: ReadonlyArray<C>, connection: C): Array<C>;
/**
 * Find connections that given connection includes (i.e between it's descendants)
 */
export declare function findDescendantConnections<C extends ConnectionElemId>(connections: ReadonlyArray<C>, connection: C): Array<C>;
export declare function mergeConnections<C extends IterableContainer<Connection<any, any>>>(connections: C): Array<C[number]>;
/**
 * Excludes the values existing in `other` array.
 * The output maintains the same order as the input.
 */
export declare function differenceConnections<C extends Connection<any, any>>(source: Iterable<C>, exclude: Iterable<C>): C[];
type WithSourceTarget<T = unknown> = {
    source: T;
    target: T;
};
export declare function hasSameSourceTarget<T>(a: WithSourceTarget<NoInfer<T>>): (b: WithSourceTarget<T>) => boolean;
export declare function hasSameSourceTarget<T>(a: WithSourceTarget<T>, b: WithSourceTarget<T>): boolean;
export declare function hasSameSource<T>(a: WithSourceTarget<NoInfer<T>>): (b: WithSourceTarget<T>) => boolean;
export declare function hasSameSource<T>(a: WithSourceTarget<T>, b: WithSourceTarget<T>): boolean;
export declare function hasSameTarget<T>(a: WithSourceTarget<NoInfer<T>>): (b: WithSourceTarget<T>) => boolean;
export declare function hasSameTarget<T>(a: WithSourceTarget<T>, b: WithSourceTarget<T>): boolean;
type WithId<T> = {
    id: T;
};
export declare function isOutgoing<T extends string>(source: WithId<NoInfer<T>>): (a: WithSourceTarget<WithId<T>>) => boolean;
export declare function isOutgoing<T extends string>(a: WithSourceTarget<WithId<T>>, source: WithId<T>): boolean;
export declare function isIncoming<T extends string>(target: WithId<NoInfer<T>>): (a: WithSourceTarget<WithId<T>>) => boolean;
export declare function isIncoming<T extends string>(a: WithSourceTarget<WithId<T>>, target: WithId<T>): boolean;
export declare function isAnyInOut<T extends string>(source: WithId<NoInfer<T>>): (a: WithSourceTarget<WithId<T>>) => boolean;
export declare function isAnyInOut<T extends string>(a: WithSourceTarget<WithId<T>>, source: WithId<T>): boolean;
export declare function isInside<T extends string>(source: WithId<NoInfer<T>>): (a: WithSourceTarget<WithId<T>>) => boolean;
export declare function isInside<T extends string>(a: WithSourceTarget<WithId<T>>, source: WithId<T>): boolean;
export {};
