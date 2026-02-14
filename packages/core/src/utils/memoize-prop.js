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
export function memoizeProp(obj, tag, fn) {
    const tagSymbol = typeof tag === 'symbol' ? tag : Symbol.for(tag);
    if (!obj.hasOwnProperty(tagSymbol)) {
        Object.defineProperty(obj, tagSymbol, {
            enumerable: false,
            writable: false,
            value: fn(),
        });
    }
    return obj[tagSymbol];
}
