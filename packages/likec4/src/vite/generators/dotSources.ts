import { CompositeGeneratorNode, NL, expandToNode, joinToNode, toString } from 'langium'

export function generateDotSources(sources: Record<string, string>) {
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
    export function dotSource(viewId: string): string {
      switch (viewId) {
  `
    .appendNewLine()
    .indent({
      indentation: 4,
      indentedChildren(indented) {
        indented.append(
          joinToNode(
            Object.keys(sources),
            key => expandToNode`
              case ${JSON.stringify(key)}: {
                return ${JSON.stringify(sources[key])}
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

    export const DotSource = memo(({viewId}: Opts) => {
      return <>{dotSource(viewId)}</>
    })
    DotSource.displayName = 'DotSource'
    `.append(NL, NL)
  return toString(out)
}
