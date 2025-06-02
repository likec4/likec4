import compare from 'natural-compare-lite'
import { isString } from 'remeda'

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

/**
 * Compares two strings hierarchically based on their depth.
 * From parent nodes to leaves
 *
 * @example
 * const lines = [
 *   'a.b.c',
 *   'a',
 *   'a.b',
 *   'a.c.c',
 * ]
 * lines.sort(compareNaturalHierarchically('.'))
 * // [
 * //   'a',
 * //   'a.b',
 * //   'a.b.c',
 * //   'a.c.c',
 * // ]
 */
export function compareNaturalHierarchically(
  separator = '.',
): (a: string | undefined, b: string | undefined) => number {
  return (a, b) => {
    if (a === b) return 0
    if (!a) return -1
    if (!b) return 1
    const aParts = a.split(separator)
    const bParts = b.split(separator)
    if (aParts.length !== bParts.length) {
      return aParts.length - bParts.length
    }
    for (let i = 0; i < aParts.length; i++) {
      const aPart = aParts[i]!
      const bPart = bParts[i]!
      const comparison = compare(aPart, bPart)
      if (comparison !== 0) {
        return comparison
      }
    }
    return 0
  }
}
