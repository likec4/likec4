import { map, pipe, takeWhile, zip } from 'remeda'

/**
 * Common head of two arrays
 *
 * @param equals - Equality function, defaults to `Object.is`
 */
export function commonHead<T>(
  sources: ReadonlyArray<T>,
  targets: ReadonlyArray<T>,
  equals?: (a: T, b: T) => boolean,
): T[] {
  if (sources.length === 0 || targets.length === 0) {
    return []
  }
  equals ??= Object.is
  const common = [] as T[]
  for (let i = 0; i < sources.length && i < targets.length; i++) {
    if (equals(sources[i]!, targets[i]!)) {
      common.push(sources[i]!)
    } else {
      break
    }
  }
  return common
}
