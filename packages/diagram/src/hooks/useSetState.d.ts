import type { NonEmptyObject } from 'type-fest';
/**
 * Differs from useState in that:
 * - it uses custom equal function (shallowEqual by default) to determine whether the state has changed.
 * - allows partial updates to the state
 */
export declare function useSetState<T extends object>(initialState: T | (() => T), equal?: (a: T, b: T) => boolean): readonly [T, (statePartial: NonEmptyObject<Partial<T>> | ((current: T) => NonEmptyObject<Partial<T>>)) => void];
