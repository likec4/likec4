import type { ComputedView } from '@likec4/core'
import { generateD2 } from '@likec4/generators'
import { CompositeGeneratorNode, NL, expandToNode, joinToNode, toString } from 'langium'

export function generateD2Sources(views: ComputedView[]) {
  const out = new CompositeGeneratorNode()
  out.appendTemplate`
    /******************************************************************************
     * This file was generated
     * DO NOT EDIT MANUALLY!
     ******************************************************************************/
    /* eslint-disable */
    import { memo } from 'react'

    type Opts = {
      viewId: string
    }
    export function d2Source(viewId: string): string {
      switch (viewId) {
  `
    .appendNewLine()
    .indent({
      indentation: 4,
      indentedChildren(indented) {
        indented.append(
          joinToNode(
            views,
            view => expandToNode`
              case ${JSON.stringify(view.id)}: {
                return ${JSON.stringify(generateD2(view))}
              }
            `,
            {
              appendNewLineIfNotEmpty: true
            }
          )
        ).appendTemplate`
        default: {
          throw new Error('Unknown viewId: ' + viewId)
        }
      `
      }
    })
    .append(NL, '  }', NL).appendTemplate`
    }

    export const D2Source = memo(({viewId}: Opts) => {
      return <>{d2Source(viewId)}</>
    })
    D2Source.displayName = 'D2Source'
    `.append(NL, NL)
  return toString(out)
}
