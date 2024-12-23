import { isNonNullish } from 'remeda'

export function isIterable<T, I extends Iterable<T>>(something: I | unknown): something is Iterable<T> {
  return isNonNullish(something) && typeof something === 'object' && Symbol.iterator in something
}
