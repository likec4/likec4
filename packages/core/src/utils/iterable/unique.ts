import type { IteratorLike } from '../../types'

/**
 * Returns an iterable that yields only unique values.
 * It uses a Set to keep track of the values.
 */
export function iunique(): <T>(iterable: Iterable<T>) => IteratorLike<T>
export function iunique<T>(iterable: Iterable<T>): IteratorLike<T>

export function iunique<T>(iterable?: Iterable<T>): IteratorLike<T> | ((iterable: Iterable<T>) => IteratorLike<T>) {
  return iterable ? _iunique(iterable) : _iunique
}

function* _iunique<T>(iterable: Iterable<T>): IteratorLike<T> {
  const seen = new Set<T>()
  for (const item of iterable) {
    if (!seen.has(item)) {
      seen.add(item)
      yield item
    }
  }
  return
}
