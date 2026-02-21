import type { LikeC4Model } from '@likec4/core/model'
import { generateDrawio, generateDrawioEditUrl } from '@likec4/generators'
import { CompositeGeneratorNode, expandToNode, joinToNode, NL, toString } from 'langium/generate'
import k from 'tinyrainbow'
import { type ProjectVirtualModule, generateCombinedProjects, generateMatches } from './_shared'

function code(model: LikeC4Model.Layouted) {
  const out = new CompositeGeneratorNode()
  out.appendTemplate`
    /******************************************************************************
     * This file was generated
     * DO NOT EDIT MANUALLY!
     ******************************************************************************/
    /* eslint-disable */

    export function drawioEditUrl(viewId) {
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
                return ${JSON.stringify(generateDrawioEditUrl(generateDrawio(view)))}
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

export const projectDrawioModule = {
  ...generateMatches('drawio'),
  async load({ likec4, project, logger }) {
    logger.info(k.dim(`generating likec4:drawio/${project.id}`))
    const model = await likec4.layoutedModel(project.id)
    return code(model)
  },
} satisfies ProjectVirtualModule

export const drawioModule = generateCombinedProjects('drawio', 'loadDrawioSources')
