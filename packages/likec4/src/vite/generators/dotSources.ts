import { CompositeGeneratorNode, expandToNode, joinToNode, NL, toString } from 'langium/generate'

export function generateDotSources(
  sources: Record<
    string,
    {
      dot: string
      svg: string
    }
  >
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
    .append(NL, '  }', NL, '}', NL, NL)
  return toString(out)
}
