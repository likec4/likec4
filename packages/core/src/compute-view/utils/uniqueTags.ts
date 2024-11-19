import { flatMap, hasAtLeast, pipe, sort, unique } from 'remeda'
import type { LiteralUnion } from 'type-fest'
import type { NonEmptyReadonlyArray } from '../../types/_common'
import type { Tag } from '../../types/element'
import { compareNatural } from '../../utils/compare-natural'

/**
 * Extracts unique tags from an array of elements.
 * and sort in natural order; returns null if no tags are present.
 */
export function uniqueTags<T extends { tags?: NonEmptyReadonlyArray<LiteralUnion<Tag, string>> | null }>(
  elements: ReadonlyArray<T>
) {
  const tags = pipe(
    elements,
    flatMap(e => e.tags ?? []),
    unique(),
    sort(compareNatural)
  )
  return hasAtLeast(tags, 1) ? tags : null
}
