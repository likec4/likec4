import compare from 'natural-compare-lite'
import { isString, sort } from 'remeda'
import type { IterableContainer, ReorderedArray } from '../types/_common'

export function compareNatural(a: string | undefined, b: string | undefined): -1 | 0 | 1 {
  if (a === b) return 0
  if (isString(a)) {
    if (isString(b)) {
      return compare(a, b)
    }
    return 1
  }
  return isString(b) ? -1 : 0
}

function _sortNatural<T extends IterableContainer<string>>(elements: T): ReorderedArray<T> {
  return sort(elements, compareNatural)
}

export function sortNatural(): <T extends IterableContainer<string>>(elements: T) => ReorderedArray<T>
export function sortNatural<T extends IterableContainer<string>>(elements: T): ReorderedArray<T>
export function sortNatural(...args: unknown[]) {
  return args.length === 0 ? _sortNatural : _sortNatural(args[0] as any)
}

/**
 * Compares two strings lexicographically first, then hierarchically based on their depth.\
 * From parent nodes to leaves
 *
 * @example
 * const lines = [
 *   'b.c',
 *   'b',
 *   'a.b.c',
 * ]
 * lines.sort(compareNaturalHierarchically('.'))
 * // [
 * //   'a.b.c',
 * //   'b',
 * //   'b.c',
 * // ]
 */
export function compareNaturalHierarchically(
  separator = '.',
  deepestFirst = false,
): (a: string | undefined, b: string | undefined) => number {
  return (a, b) => {
    if (a === b) return 0
    if (!a) return -1
    if (!b) return 1
    const aParts = a.split(separator)
    const bParts = b.split(separator)

    // Find the minimum length to avoid out-of-bounds access
    const minLength = Math.min(aParts.length, bParts.length)

    // Compare segments until we find a difference
    for (let i = 0; i < minLength; i++) {
      const aPart = aParts[i]!
      const bPart = bParts[i]!
      const comparison = compare(aPart, bPart)
      if (comparison !== 0) {
        return comparison
      }
    }

    // If all common segments are equal, shorter paths come first (if deepestFirst is false)
    const diff = aParts.length - bParts.length
    return deepestFirst ? -1 * diff : diff
  }
}
