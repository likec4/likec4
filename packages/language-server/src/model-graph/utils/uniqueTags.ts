import { compareNatural, hasAtLeast, type NonEmptyReadonlyArray, type Tag } from '@likec4/core'
import { flatMap, pipe, sort, unique } from 'remeda'
import type { LiteralUnion } from 'type-fest'

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
