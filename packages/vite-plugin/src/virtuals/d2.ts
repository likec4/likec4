import type { LikeC4Model } from '@likec4/core/model'
import { generateD2 } from '@likec4/generators'
import { CompositeGeneratorNode, expandToNode, joinToNode, NL, toString } from 'langium/generate'
import k from 'tinyrainbow'
import { logGenerating } from '../logger'
import { type ProjectVirtualModule, generateCombinedProjects, generateMatches } from './_shared'

function code(model: LikeC4Model.Computed) {
  const out = new CompositeGeneratorNode()
  out.appendTemplate`
    /******************************************************************************
     * This file was generated
     * DO NOT EDIT MANUALLY!
     ******************************************************************************/
    /* eslint-disable */

    export function d2Source(viewId) {
      switch (viewId) {
  `
    .appendNewLine()
    .indent({
      indentation: 4,
      indentedChildren(indented) {
        indented.append(
          joinToNode(
            [...model.views()],
            view =>
              expandToNode`
              case ${JSON.stringify(view.id)}: {
                return ${JSON.stringify(generateD2(view))}
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

export const projectD2Module = {
  ...generateMatches('d2'),
  async load({ likec4, project }) {
    logGenerating('d2', project.id)
    const model = await likec4.computedModel(project.id)
    return {
      code: code(model),
      moduleType: 'js',
      moduleSideEffects: false,
    }
  },
} satisfies ProjectVirtualModule

export const d2Module = generateCombinedProjects('d2', 'loadD2Sources')
