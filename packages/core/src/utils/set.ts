import { intersection as _intersection, symmetricDifference as _symmetricDifference } from 'mnemonist/set'
import type { NonEmptyArray } from '../types/_common'

/**
 * Returns new set as a union of given sets
 * Keeps order of elements
 */
export function union<T>(...sets: ReadonlySet<T>[]): Set<T> {
  let result = new Set<T>()
  for (const set of sets) {
    for (const value of set) {
      result.add(value)
    }
  }
  return result
}

/**
 * Returns new set as an intersection of all sets
 * Keeps order from the first set
 */
export function intersection<T>(first: ReadonlySet<T>, ...sets: NonEmptyArray<ReadonlySet<NoInfer<T>>>): Set<T> {
  let result = new Set<T>()
  // If first set is empty, return empty set
  if (first.size === 0) {
    return result
  }
  let other = sets.length > 1 ? _intersection(...sets as any) : sets[0]
  if (other.size === 0) {
    return result
  }
  for (const value of first) {
    if (other.has(value)) {
      result.add(value)
    }
  }
  return result
}

export function difference<T>(a: ReadonlySet<T>, b: ReadonlySet<NoInfer<T>>): Set<T> {
  if (a.size === 0) {
    return new Set<T>()
  }
  if (b.size === 0) {
    return new Set(a)
  }
  let result = new Set<T>()
  for (const value of a) {
    if (!b.has(value)) {
      result.add(value)
    }
  }
  return result
}

export function equals<T>(a: ReadonlySet<T>, b: ReadonlySet<T>): boolean {
  return a.size === b.size && [...a].every(value => b.has(value))
}

export function symmetricDifference<T>(a: ReadonlySet<T>, b: ReadonlySet<T>): Set<T> {
  return _symmetricDifference(a as Set<T>, b as Set<T>)
}

export function hasIntersection<T>(a: ReadonlySet<T>, b: ReadonlySet<T>): boolean {
  if (a.size === 0 || b.size === 0) {
    return false
  }
  // Swap sets to iterate over smaller set
  if (b.size < a.size) {
    ;[a, b] = [b, a]
  }
  for (const value of a) {
    if (b.has(value)) {
      return true
    }
  }
  return false
}
