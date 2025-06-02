import type { ComputedView } from '@likec4/core'
import { generatePuml } from '@likec4/generators'
import { CompositeGeneratorNode, expandToNode, joinToNode, NL, toString } from 'langium/generate'
import k from 'tinyrainbow'
import { type ProjectVirtualModule, generateCombinedProjects, generateMatches } from './_shared'

const code = (views: ComputedView[]) => {
  const out = new CompositeGeneratorNode()
  out.appendTemplate`
    /******************************************************************************
     * This file was generated
     * DO NOT EDIT MANUALLY!
     ******************************************************************************/
    /* eslint-disable */

    export function pumlSource(viewId) {
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
                return ${JSON.stringify(generatePuml(view))}
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

export const projectPumlModule = {
  ...generateMatches('puml'),
  async load({ likec4, projectId, logger }) {
    logger.info(k.dim(`generating likec4:puml/${projectId}`))
    const views = await likec4.views.computedViews(projectId)
    return code(views)
  },
} satisfies ProjectVirtualModule

export const pumlModule = generateCombinedProjects('puml', 'loadPumlSources')
