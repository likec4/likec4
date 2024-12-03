import type { NonEmptyArray } from '../types/_common'

/**
 * Union of sets
 */
export function union<T>(a: ReadonlySet<T>, ...others: NonEmptyArray<ReadonlySet<T>>): Set<T> {
  return new Set<T>([...a].concat(...others.map(set => [...set])))
}

export function intersection<T>(a: ReadonlySet<T>, b: ReadonlySet<T>) {
  if (a.size === 0 || b.size === 0) {
    return new Set<T>()
  }
  return new Set([...a].filter(value => b.has(value)))
}

export function difference<T>(a: ReadonlySet<T>, b: ReadonlySet<T>) {
  if (a.size === 0 || b.size === 0) {
    return new Set<T>(a)
  }
  return new Set([...a].filter(value => !b.has(value)))
}

export function equals<T>(a: ReadonlySet<T>, b: ReadonlySet<T>) {
  return a.size === b.size && [...a].every(value => b.has(value))
}

export function symmetricDifference<T>(a: ReadonlySet<T>, b: ReadonlySet<T>) {
  return union(
    difference(a, b),
    difference(b, a)
  )
}
