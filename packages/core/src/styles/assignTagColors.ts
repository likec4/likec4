import { DefaultTagColors } from '@likec4/style-preset/defaults'
import { concat, entries, isTruthy, map, pipe, prop, pullObject, sort } from 'remeda'
import type { ColorLiteral, TagSpecification } from '../types'
import type { Tag } from '../types/scalar'
import { compareNatural } from '../utils/compare-natural'
import { nonNullable } from '../utils/invariant'

/**
 * Colors are taken from the styles presets of the LikeC4 (Radix Colors)
 */
export { DefaultTagColors }

export function assignTagColors(tags: {
  [kind: string]: Partial<TagSpecification>
}): Record<Tag, TagSpecification> {
  const tagsWithColors = [] as { tag: Tag; spec: TagSpecification }[]
  const tagsWithoutColors = [] as Tag[]
  for (const [tag, spec] of entries(tags)) {
    if (isTruthy(spec.color)) {
      tagsWithColors.push({
        tag: tag as Tag,
        spec: {
          color: spec.color,
        },
      })
    } else {
      tagsWithoutColors.push(tag as Tag)
    }
  }
  return pipe(
    tagsWithoutColors,
    sort(compareNatural),
    map((tag, idx) => {
      const color = nonNullable(DefaultTagColors[idx % DefaultTagColors.length] as ColorLiteral)
      return {
        tag,
        spec: {
          color,
        } as TagSpecification,
      }
    }),
    concat(tagsWithColors),
    sort((a, b) => compareNatural(a.tag, b.tag)),
    pullObject(prop('tag'), prop('spec')),
  )
}
