import { generateMermaid } from '@likec4/generators'
import { CompositeGeneratorNode, expandToNode, joinToNode, NL, toString } from 'langium/generate'
import type { ComputedView } from '../../model'

export function generateMmdSources(views: ComputedView[]) {
  const out = new CompositeGeneratorNode()
  out.appendTemplate`
    /******************************************************************************
     * This file was generated
     * DO NOT EDIT MANUALLY!
     ******************************************************************************/
    /* eslint-disable */

    export function mmdSource(viewId) {
      switch (viewId) {
  `
    .appendNewLine()
    .indent({
      indentation: 4,
      indentedChildren(indented) {
        indented.append(
          joinToNode(
            views,
            view =>
              expandToNode`
              case ${JSON.stringify(view.id)}: {
                return ${JSON.stringify(generateMermaid(view))}
              }
            `,
            {
              appendNewLineIfNotEmpty: true,
            },
          ),
        ).appendTemplate`
          default: {
            throw new Error('Unknown viewId: ' + viewId)
          }
        `
      },
    })
    .append(NL, '  }', NL).appendTemplate`
    }

    `.append(NL, NL)
  return toString(out)
}
