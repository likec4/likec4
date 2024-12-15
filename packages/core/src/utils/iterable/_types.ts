import { isNonNullish } from 'remeda'

export type IteratorLike<T> = IteratorObject<T, BuiltinIteratorReturn>

export function isIterable<T, I extends Iterable<T>>(something: I | unknown): something is Iterable<T> {
  return isNonNullish(something) && typeof something === 'object' && Symbol.iterator in something
}
