export type IteratorLike<T> = IteratorObject<T, BuiltinIteratorReturn>

export function filter<T, S extends T>(iterable: Iterable<T>, predicate: (v: T) => v is S): IteratorLike<S>
export function filter<T>(iterable: Iterable<T>, predicate: (v: T) => boolean): IteratorLike<T>
export function* filter(iterable: Iterable<unknown>, predicate: (v: any) => boolean): IteratorLike<unknown> {
  for (const item of iterable) {
    if (predicate(item)) {
      yield item
    }
  }
  return
}

export function* distinct<T>(iterable: Iterable<T>): IteratorLike<T> {
  const seen = new Set<T>()
  for (const item of iterable) {
    if (!seen.has(item)) {
      seen.add(item)
      yield item
    }
  }
  return
}

export function* flatten<T>(iterable: Iterable<IteratorLike<T>>): IteratorLike<T> {
  for (const inner of iterable) {
    yield* inner
  }
  return
}

export function toArray<T>(iterable: Iterable<T>): T[] {
  return [...iterable]
}
