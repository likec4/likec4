import type { DiagramView } from '@likec4/core/types'
import JSON5 from 'json5'
import { CompositeGeneratorNode, NL, expandToNode, joinToNode, toString } from 'langium'

const componentName = (value: string): string => {
  if (!value.charAt(0).match(/[a-zA-Z]/)) {
    value = 'View' + value
  }
  value = value.replaceAll('_', '')
  return value.charAt(0).toLocaleUpperCase() + value.slice(1)
}

export function generateReact(
  views: DiagramView[],
) {

  const components = views.map(({ id }) => {
    return {
      id,
      name: componentName(id),
    }
  })

  const out = new CompositeGeneratorNode()
  out
    .appendTemplate`
      /******************************************************************************
       * This file was generated
       * DO NOT EDIT MANUALLY!
       ******************************************************************************/
      /* eslint-disable */

      import type { DiagramView, EmbeddedDiagramProps } from '@likec4/diagrams'
      import { EmbeddedDiagram } from '@likec4/diagrams'
    `
    .append(NL, NL)

  if (components.length == 0) {
    out.append('export {}', NL)
    return toString(out)
  }

  out
    .append(
      'export const LikeC4ViewData = {', NL
    )
    .indent(indent => {
      indent.append(
        joinToNode(
          views,
          view => expandToNode`'${view.id}': (${JSON5.stringify(view)} as any) as DiagramView`,
          {
            separator: ',',
            appendNewLineIfNotEmpty: true
          }
        )
      )
    })
    .append('} as const', NL, NL)
    .appendTemplate`
      export type ViewId = keyof typeof LikeC4ViewData
      export function isViewId(value: unknown): value is ViewId {
        return typeof value === 'string' && value in LikeC4ViewData
      }

      export type LikeC4ViewProps = Omit<EmbeddedDiagramProps, 'diagram'>;
      export function LikeC4View({viewId, ...rest}: LikeC4ViewProps & { viewId: ViewId }) {
        return <EmbeddedDiagram diagram={LikeC4ViewData[viewId]} {...rest}/>
      }
    `
    .append(
      NL, NL,
      joinToNode(
        components,
        ({ id, name }) =>
          expandToNode`
            LikeC4View['${name}'] = (props: LikeC4ViewProps) => <EmbeddedDiagram diagram={LikeC4ViewData['${id}']} {...props}/>
          `,
        {
          separator: ',',
          appendNewLineIfNotEmpty: true
        }
      ),
      NL
    )

  return toString(out)
}
