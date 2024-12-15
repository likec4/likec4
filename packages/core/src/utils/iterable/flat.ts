import type { IteratorLike } from './_types'

export function iflat(): <T>(iterable: Iterable<IteratorLike<T>>) => IteratorLike<T>
export function iflat<T>(iterable: Iterable<IteratorLike<T>>): IteratorLike<T>

export function iflat<T>(
  iterable?: Iterable<IteratorLike<T>>
): IteratorLike<T> | ((iterable: Iterable<IteratorLike<T>>) => IteratorLike<T>) {
  return iterable ? _iflat(iterable) : _iflat
}

function* _iflat<T>(iterable: Iterable<IteratorLike<T>>): IteratorLike<T> {
  for (const inner of iterable) {
    yield* inner
  }
  return
}
