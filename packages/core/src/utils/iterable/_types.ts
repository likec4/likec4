export function isIterable<T, I extends Iterable<T>>(something: I | unknown): something is Iterable<T> {
  return something != null && typeof something === 'object' && Symbol.iterator in something
}
