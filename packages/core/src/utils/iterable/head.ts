export function ihead<T>(): (iterable: Iterable<T>) => T | undefined
/**
 * Finds the first element in the iterable that satisfies the predicate.
 * Data first version of `find`.
 * @signature
 *  ifind(data, predicate)
 */
export function ihead<T>(iterable: Iterable<T>): T | undefined

export function ihead<T>(iterable?: Iterable<T>) {
  if (!iterable) {
    return _head
  }
  return _head(iterable)
}

function _head<T>(iter: Iterable<T>) {
  const iterator = iter[Symbol.iterator]()
  const { value } = iterator.next()
  return value
}
