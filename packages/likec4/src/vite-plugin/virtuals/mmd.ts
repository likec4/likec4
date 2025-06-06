import type { LikeC4Model } from '@likec4/core/model'
import { generateMermaid } from '@likec4/generators'
import { CompositeGeneratorNode, expandToNode, joinToNode, NL, toString } from 'langium/generate'
import { type ProjectVirtualModule, generateCombinedProjects, generateMatches, k } from './_shared'

function code(model: LikeC4Model.Computed) {
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
            [...model.views()],
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

export const projectMmdSourcesModule = {
  ...generateMatches('mmd'),
  async load({ likec4, projectId, logger }) {
    logger.info(k.dim(`generating virtual:likec4/mmd/${projectId}`))
    const model = await likec4.computedModel(projectId)
    return code(model)
  },
} satisfies ProjectVirtualModule

export const mmdModule = generateCombinedProjects('mmd', 'loadMmdSources')
