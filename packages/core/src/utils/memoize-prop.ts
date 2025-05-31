/**
 * Saves the value returned by fn() in a hidden property tag of obj object, so next time memoizeProp() is called,
 * that value will be returned, and fn won't be called.
 *
 * @example
 * ```ts
 * class Model {
 *   get computed() {
 *     return memoizeProp(this, Symbol('computed'), () => doOnce())
 *   }
 * }
 * ```
 */
export function memoizeProp<Tag extends symbol, Res>(obj: object, tag: Tag, fn: () => Res): Res {
  if (!obj.hasOwnProperty(tag)) {
    Object.defineProperty(obj, tag, {
      enumerable: false,
      writable: false,
      value: fn(),
    })
  }
  return (obj as any)[tag]!
}
