/**
 * Saves the value returned by fn() in a hidden property tag of obj object, so next time memoizeProp() is called,
 * that value will be returned, and fn won't be called.
 *
 * @example
 * ```ts
 * class Model {
 *   // using same Symbol
 *   get computed1() {
 *     return memoizeProp(this, Symbol.for('computed1'), () => doOnce())
 *   }
 *   // using string
 *   get computed2() {
 *     return memoizeProp(this, 'computed2', () => doOnce())
 *   }
 *
 * }
 * ```
 */
export declare function memoizeProp<Tag extends symbol | string, Res>(obj: object, tag: Tag, fn: () => Res): Res;
