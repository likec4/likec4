import {
  difference as _difference,
  intersection as _intersection,
  symmetricDifference as _symmetricDifference,
  union as _union
} from 'mnemonist/set'
import type { NonEmptyArray } from '../types/_common'

/**
 * Union of sets
 */
export function union<T>(...sets: NonEmptyArray<ReadonlySet<T>>): Set<T> {
  return _union(...sets as any)
}

export function intersection<T>(...sets: NonEmptyArray<ReadonlySet<T>>): Set<T> {
  return _intersection(...sets as any)
}

export function difference<T>(a: ReadonlySet<T>, b: ReadonlySet<T>) {
  return _difference(a as Set<T>, b as Set<T>)
}

export function equals<T>(a: ReadonlySet<T>, b: ReadonlySet<T>) {
  return a.size === b.size && [...a].every(value => b.has(value))
}

export function symmetricDifference<T>(a: ReadonlySet<T>, b: ReadonlySet<T>) {
  return _symmetricDifference(a as Set<T>, b as Set<T>)
}
