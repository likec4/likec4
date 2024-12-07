import { map, pipe, takeWhile, zip } from 'remeda'

/**
 * Common head of two arrays
 *
 * @param equals - Equality function, defaults to `Object.is`
 */
export function commonHead<T>(
  sources: ReadonlyArray<T>,
  targets: ReadonlyArray<T>,
  equals?: (a: T, b: T) => boolean
): T[] {
  if (sources.length === 0 || targets.length === 0) {
    return []
  }
  equals ??= Object.is
  return pipe(
    zip(sources, targets),
    takeWhile(([source, target]) => equals(source, target)),
    map(([source, _]) => source)
  )
}
