export function toArray(): <T>(iterable: Iterable<T> | ArrayLike<T>) => T[]
export function toArray<T>(iterable: Iterable<T> | ArrayLike<T>): T[]
export function toArray<T>(
  iterable?: Iterable<T> | ArrayLike<T>
): T[] | (<T>(iterable: Iterable<T> | ArrayLike<T>) => T[]) {
  if (iterable) {
    return Array.from(iterable)
  }
  return (it) => Array.from(it)
}

export function toSet(): <T>(iterable: Iterable<T>) => Set<T>
export function toSet<T>(iterable: Iterable<T>): Set<T>
export function toSet<T>(iterable?: Iterable<T>): Set<T> | ((iterable: Iterable<T>) => Set<T>) {
  if (iterable) {
    return new Set(iterable)
  }
  return (it) => new Set(it)
}
