import { entries, flatMap, groupBy, map, mapValues, pipe, piped, prop, sortBy, unique } from 'remeda'
import type { ComputedNode, ElementNotation } from '../../types'

/**
 * Build element notations from computed nodes:
 * 1. Group by notation
 * 2. Group by shape
 * 3. Group by color
 * 4. For each group get unique kinds
 * 5. Unwind the groups
 */
export function buildElementNotations(nodes: ComputedNode[]): ElementNotation[] {
  return pipe(
    nodes,
    groupBy(prop('notation')),
    mapValues(
      piped(
        groupBy(prop('shape')),
        mapValues(
          piped(
            groupBy(prop('color')),
            mapValues(
              piped(
                map(prop('kind')),
                unique()
              )
            ),
            entries(),
            map(([color, kinds]) => ({
              kinds,
              color
            }))
          )
        ),
        entries(),
        flatMap(([shape, colors]) =>
          colors.map(({ color, kinds }) => ({
            shape,
            color,
            kinds
          }))
        )
      )
    ),
    entries(),
    flatMap(([title, shapes]) =>
      shapes.map(({ shape, color, kinds }) => ({
        title,
        shape,
        color,
        kinds
      }))
    ),
    sortBy(
      prop('shape'),
      prop('title'),
      [
        n => n.kinds.length,
        'desc'
      ]
    )
  )
}
