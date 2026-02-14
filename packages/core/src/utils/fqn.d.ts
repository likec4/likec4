import type { Fqn, IterableContainer, ReorderedArray } from '../types';
export type Predicate<T> = (x: T) => boolean;
export declare function parentFqn<E extends string>(fqn: E): E | null;
export declare function parentFqnPredicate<T extends {
    parent: Fqn | null;
}>(parent: Fqn): Predicate<T>;
export declare function nameFromFqn<E extends string>(fqn: E): string;
/**
 * Check if one element is an ancestor of another
 * Composable version
 * @signature
 *  isAncestor(another)(ancestor)
 */
export declare function isAncestor<A extends string | {
    id: string;
}>(another: NoInfer<A>): (ancestor: A) => boolean;
/**
 * Check if one element is an ancestor of another
 * @signature
 *   isAncestor(ancestor, another)
 */
export declare function isAncestor<A extends string | {
    id: string;
}>(ancestor: A, another: A): boolean;
export declare function isSameHierarchy<T extends string>(one: NoInfer<T> | WithId<NoInfer<T>>): (another: T | WithId<T>) => boolean;
export declare function isSameHierarchy<T extends string>(one: T | WithId<T>, another: T | WithId<T>): boolean;
type WithId<T = string> = {
    id: T;
};
export declare function isDescendantOf<T extends string>(ancestor: WithId<T>): (descedant: WithId<T>) => boolean;
export declare function isDescendantOf<T extends string>(descedant: WithId<T>, ancestor: WithId<T>): boolean;
/**
 * How deep in the hierarchy the element is.
 * Root element has depth 1
 */
export declare function hierarchyLevel<E extends string | {
    id: Fqn;
}>(elementOfFqn: E): number;
/**
 * Calculate the distance as number of steps from one element to another, i.e.
 * going up to the common ancestor, then going down to the other element.
 * Sibling distance is always 1
 *
 * Can be used for hierarchical clustering
 */
export declare function hierarchyDistance<E extends string | {
    id: Fqn;
}>(one: E, another: E): number;
export declare function commonAncestor<E extends string>(first: E, second: E): E | null;
/**
 * Get all ancestor elements (i.e. parent, parent’s parent, etc.)
 * going up from parent to the root
 * @example
 * ```ts
 * ancestorsFqn('a.b.c.d')
 * // ['a.b.c', 'a.b', 'a']
 * ```
 */
export declare function ancestorsFqn<Id extends string>(fqn: Id): Id[];
/**
 * Compares two fully qualified names (fqns) hierarchically based on their depth.
 * From parent nodes to leaves
 *
 * @param {string} a - The first fqn to compare.
 * @param {string} b - The second fqn to compare.
 * @returns {number} - 0 if the fqns have the same depth.
 *                    - Positive number if a is deeper than b.
 *                    - Negative number if b is deeper than a.
 */
export declare function compareFqnHierarchically<T extends string = string>(a: T, b: T): -1 | 0 | 1;
export declare function compareByFqnHierarchically<T extends {
    id: string;
}>(a: T, b: T): -1 | 0 | 1;
/**
 * Sorts an array of objects hierarchically based on their fully qualified names (FQN).
 * Objects are sorted by the number of segments in their FQN (defined by dot-separated ID).
 *
 * @typeParam T - Object type that contains an 'id' string property
 * @typeParam A - Type extending IterableContainer of T
 *
 * @param array - Array of objects to be sorted
 * @returns A new array with items sorted by their FQN hierarchy depth (number of segments)
 *
 * @example
 * ```ts
 * const items = [
 *   { id: "a.b.c" },
 *   { id: "a" },
 *   { id: "a.b" }
 * ];
 * sortByFqnHierarchically(items);
 * // Result: [
 * //   { id: "a" },
 * //   { id: "a.b" },
 * //   { id: "a.b.c" }
 * // ]
 * ```
 */
export declare function sortByFqnHierarchically<T extends {
    id: string;
}, A extends IterableContainer<T>>(array: A): ReorderedArray<A>;
/**
 * Keeps initial order of the elements, but ensures that parents are before children
 *
 * @example
 * ```ts
 * const items = [
 *   {id: 'a.c'},
 *   {id: 'a'},
 *   {id: 'a.b.c'},
 *   {id: 'a.b'},
 * ];
 * sortParentsFirst(items);
 * // Result: [
 * //   { id: "a" },
 * //   { id: "a.c" }, // because of initial order
 * //   { id: "a.b" },
 * //   { id: "a.b.c" },
 * // ]
 * ```
 */
export declare function sortParentsFirst<T extends WithId<string>, A extends IterableContainer<T>>(array: A): ReorderedArray<A>;
/**
 * Sorts an array of objects naturally by their fully qualified name (FQN) identifier.
 *
 * @template T - Type of objects containing an 'id' string property
 * @template A - Type extending IterableContainer of T
 *
 * @param first - Optional. Either the array to sort or the sort direction ('asc'|'desc')
 * @param sort - Optional. The sort direction ('asc'|'desc'). Defaults to 'asc' if not specified
 *
 * @example
 * // As a function that returns a sorting function
 * const sorted = sortNaturalByFqn('desc')(myArray);
 *
 * // Direct array sorting
 * const sorted = sortNaturalByFqn(myArray, 'desc');
 */
export declare function sortNaturalByFqn(sort?: 'asc' | 'desc'): <I extends WithId<string>, A extends IterableContainer<I>>(array: A) => ReorderedArray<A>;
export declare function sortNaturalByFqn<A extends IterableContainer<WithId>>(array: A, sort?: 'asc' | 'desc'): ReorderedArray<A>;
export {};
