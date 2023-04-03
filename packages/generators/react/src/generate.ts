import type { DiagramView } from '@likec4/core/types'
import { CompositeGeneratorNode, Grammar, LangiumServices, NL, normalizeEOL, expandToNode, toString, joinToNode } from 'langium'
import { generatedHeader } from './util'
import { indexBy } from 'rambdax'
import JSON5 from 'json5'

const capitalizeName = (value: string): string => value.charAt(0).toLocaleUpperCase() + value.slice(1)

export function generate(
  views: DiagramView[],
) {

  const out = new CompositeGeneratorNode()
  out.append(generatedHeader())

  out.append(
    'import type { DiagramView, EmbeddedDiagramProps } from \'@likec4/diagrams\'', NL,
    'import { EmbeddedDiagram } from \'@likec4/diagrams\'', NL, NL
  )

  const components = views.map(({ id }) => {
    return {
      id,
      name: capitalizeName(id),
    }
  })

  if (components.length == 0) {
    out.append('export {}', NL)
    return toString(out)
  }


  out
    .append('export type ViewId =', NL)
    .indent(indenting => {
      components.forEach(({ id }, index) => {
        indenting.appendNewLineIf(index > 0)
        indenting.append(`| '${id}'`)
      })
      indenting.append(';')
    })
    .append(NL, NL)

  out
    .append(
      'export const LikeC4ViewsData: Record<ViewId, DiagramView> = {', NL
    )
    .indent(indent => {
      indent.append(
        joinToNode(
          views,
          view => expandToNode`'${view.id}': ${JSON5.stringify(view)} as any`,
          {
            separator: ',',
            appendNewLineIfNotEmpty: true
          }
        )
      )
    })
    .append('}', NL, NL)


  out
    .appendTemplate`
      export type LikeC4ViewProps = Omit<EmbeddedDiagramProps, 'diagram'>;
    `
    .appendNewLine()
    .append(
      'export const LikeC4View = {', NL
    )
    .indent(indent => {
      indent.append(
        joinToNode(
          components,
          ({ id, name }) => expandToNode`
            '${name}': (props: LikeC4ViewProps) => <EmbeddedDiagram diagram={LikeC4ViewsData['${id}']} {...props}/>
          `,
          {
            separator: ',',
            appendNewLineIfNotEmpty: true
          }
        )
      )
    })
    .append('} as const', NL, NL)



  // components.forEach(({ id, name }, index) => {
  //   out.appendTemplate`
  //     export function ${name}() {
  //       return <EmbeddedDiagram viewId="${id}"/>
  //     }
  //     `
  //   out.appendNewLineIf(index > 0)
  // })

  // out.append('export const view: DiagramView = ', JSON5.stringify(view, null, 2), NL)

  // out.appendNewLineIfNotEmpty()

  return toString(out)
}
