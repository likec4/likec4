import { generateMermaid } from '@likec4/generators'
import { CompositeGeneratorNode, expandToNode, joinToNode, NL, toString } from 'langium/generate'
import type { ComputedView } from '../../model'
import { type ProjectVirtualModule, generateCombinedProjects, generateMatches, k } from './_shared'

function code(views: ComputedView[]) {
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

export const projectMmdSourcesModule = {
  ...generateMatches('mmd'),
  async load({ likec4, projectId, logger }) {
    logger.info(k.dim(`generating virtual:likec4/mmd/${projectId}`))
    const views = await likec4.views.computedViews(projectId)
    return code(views)
  },
} satisfies ProjectVirtualModule

export const mmdModule = generateCombinedProjects('mmd', 'loadMmdSources')
