import { flatMap, hasAtLeast, pipe, sort, unique } from 'remeda'
import type { NonEmptyReadonlyArray } from '../../types/_common'
import { compareNatural } from '../../utils/compare-natural'

/**
 * Extracts unique tags from an array of elements.
 * and sort in natural order; returns null if no tags are present.
 */
export function uniqueTags<T extends string, E extends { tags: readonly T[] }>(
  elements: ReadonlyArray<E>,
): NonEmptyReadonlyArray<T> | null {
  const tags = pipe(
    elements,
    flatMap(e => e.tags),
    unique(),
    sort(compareNatural),
  )
  return hasAtLeast(tags, 1) ? tags as unknown as NonEmptyReadonlyArray<T> : null
}
