/**
 * Memoizes a callback function so that it will not be recreated on every render.
 * The returned function is guaranteed to be the same reference across renders.
 * @param callback the callback function to memoize
 * @returns the memoized callback function
 */
export declare function useCallbackRef<T extends (...args: any[]) => any>(callback: T | null | undefined): T;
