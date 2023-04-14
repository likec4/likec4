import type { DiagramView } from '@likec4/core/types'
import JSON5 from 'json5'
import { CompositeGeneratorNode, NL, expandToNode, joinToNode, toString } from 'langium'

export function generateViewsDataTs(
  views: DiagramView[],
) {

  const out = new CompositeGeneratorNode()
  out
    .appendTemplate`
      /******************************************************************************
       * This file was generated
       * DO NOT EDIT MANUALLY!
       ******************************************************************************/
      /* eslint-disable */

      import type { DiagramView } from '@likec4/diagrams'
    `
    .append(NL, NL)

  out
    .append(
      'export const LikeC4ViewsData = {', NL
    )
    .indent({
      indentation: 2,
      indentedChildren: indent => {
        indent.append(
          joinToNode(
            views,
            view => expandToNode`'${view.id}': (${JSON5.stringify(view)} as unknown) as DiagramView`,
            {
              separator: ',',
              appendNewLineIfNotEmpty: true
            }
          )
        )
      },
    })
    .append('} as const', NL, NL)
    .appendTemplate`
      export type LikeC4ViewsData = typeof LikeC4ViewsData
      export type ViewId = keyof LikeC4ViewsData
      export function isViewId(value: unknown): value is ViewId {
        return typeof value === 'string' && value in LikeC4ViewsData
      }
    `
    .append(NL)
  return toString(out)
}
