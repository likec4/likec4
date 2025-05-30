import { compareNatural, nonNullable } from '@likec4/core'
import type * as c4 from '@likec4/core/types'
import { concat, entries, isTruthy, map, pipe, prop, pullObject, sort } from 'remeda'
import { MergedSpecification } from './MergedSpecification'

/**
 * Colors are taken from the styles presets of the LikeC4
 */
const colors = [
  'tomato',
  'grass',
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
  'blue',
  'violet',
]

export function assignTagColors(specification: MergedSpecification) {
  const tagsWithColors = [] as { tag: c4.Tag; spec: c4.TagSpecification }[]
  const tagsWithoutColors = [] as c4.Tag[]
  for (const [tag, spec] of entries(specification.specs.tags)) {
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
      const color = nonNullable(colors[idx % colors.length] as c4.ColorLiteral)
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
