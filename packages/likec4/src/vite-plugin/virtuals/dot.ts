import { CompositeGeneratorNode, expandToNode, joinToNode, NL, toString } from 'langium/generate'
import { mapToObj } from 'remeda'
import { type ProjectVirtualModule, generateCombinedProjects, generateMatches, k } from './_shared'

function code(
  sources: Record<
    string,
    {
      dot: string
      svg: string
    }
  >,
) {
  const out = new CompositeGeneratorNode()

  out.appendTemplate`
    /******************************************************************************
     * This file was generated
     * DO NOT EDIT MANUALLY!
     ******************************************************************************/
    /* eslint-disable */

    export function dotSource(viewId) {
      switch (viewId) {
  `
    .appendNewLine()
    .indent({
      indentation: 4,
      indentedChildren(indented) {
        indented.append(
          joinToNode(
            Object.keys(sources),
            key =>
              expandToNode`
              case ${JSON.stringify(key)}: {
                return ${JSON.stringify(sources[key]!.dot)}
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

    export function svgSource(viewId) {
      switch (viewId) {
    `
    .appendNewLine()
    .indent({
      indentation: 4,
      indentedChildren(indented) {
        indented.append(
          joinToNode(
            Object.keys(sources),
            key =>
              expandToNode`
              case ${JSON.stringify(key)}: {
                return ${JSON.stringify(sources[key]!.svg)}
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
    .append(NL, '  }', NL, '}', NL, NL)
  return toString(out)
}

export const projectDotSourcesModule = {
  ...generateMatches('dot'),
  async load({ likec4, projectId, logger }) {
    logger.info(k.dim(`generating virtual:likec4/dot/${projectId}`))
    const views = await likec4.views.viewsAsGraphvizOut()
    const sources = mapToObj(views, ({ id, svg, dot }) => [id, { dot, svg }])
    return code(sources)
  },
} satisfies ProjectVirtualModule

export const dotModule = generateCombinedProjects('dot', 'loadDotSources')
