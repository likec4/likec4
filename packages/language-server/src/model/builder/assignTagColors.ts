import type * as c4 from '@likec4/core/types'
import { compareNatural, nonNullable } from '@likec4/core/utils'
import { concat, entries, isTruthy, map, pipe, prop, pullObject, sort } from 'remeda'
import type { ParsedAstSpecification } from '../../ast'

/**
 * Colors are taken from the styles presets of the LikeC4
 */
export const radixColors = [
  'tomato',
  'grass',
  'blue',
  'ruby',
  'orange',
  'indigo',
  'pink',
  'teal',
  'purple',
  'amber',
  'crimson',
  'red',
  'lime',
  'yellow',
  'violet',
]

export function assignTagColors(tags: ParsedAstSpecification['tags']): Record<c4.Tag, c4.TagSpecification> {
  const tagsWithColors = [] as { tag: c4.Tag; spec: c4.TagSpecification }[]
  const tagsWithoutColors = [] as c4.Tag[]
  for (const [tag, spec] of entries(tags)) {
    if (isTruthy(spec.color)) {
      tagsWithColors.push({
        tag: tag as c4.Tag,
        spec: {
          color: spec.color,
        },
      })
    } else {
      tagsWithoutColors.push(tag as c4.Tag)
    }
  }
  return pipe(
    tagsWithoutColors,
    sort(compareNatural),
    map((tag, idx) => {
      const color = nonNullable(radixColors[idx % radixColors.length] as c4.ColorLiteral)
      return {
        tag,
        spec: {
          color,
        } as c4.TagSpecification,
      }
    }),
    concat(tagsWithColors),
    sort((a, b) => compareNatural(a.tag, b.tag)),
    pullObject(prop('tag'), prop('spec')),
  )
}
