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
      import '@likec4/diagrams/dist/index.css'
    `
    .append(NL, NL)

  if (components.length == 0) {
    out.append('export {}', NL)
    return toString(out)
  }

  out
    .append(
      'export const LikeC4ViewsData = {', NL
    )
    .indent({
      indentation: 2,
      indentedChildren: indent => {
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
      },
    })
    .append('} as const', NL, NL)
    .appendTemplate`
      export type LikeC4ViewsData = typeof LikeC4ViewsData
      export type ViewId = keyof LikeC4ViewsData
      export function isViewId(value: unknown): value is ViewId {
        return typeof value === 'string' && value in LikeC4ViewsData
      }

      export type LikeC4ViewProps = Omit<EmbeddedDiagramProps<LikeC4ViewsData, ViewId>, 'views'>;
      export function LikeC4View(props: LikeC4ViewProps) {
        return <EmbeddedDiagram views={LikeC4ViewsData} {...props}/>
      }

      type LikeC4ViewsProps = Omit<EmbeddedDiagramProps<LikeC4ViewsData, ViewId>, 'views' | 'viewId'>
      export const LikeC4Views = {
    `
    .append(NL)
    .indent({
      indentation: 2,
      indentedChildren: components.map(({ id, name }) =>
          expandToNode`
            ['${name}']: (props: LikeC4ViewsProps) => <LikeC4View viewId={'${id}'} {...props}/>,
          `.append(NL)
      )
      // indentedChildren: [joinToNode(
      //   components,
      //   ({ id, name }) =>
      //     expandToNode`
      //       ['${name}']: (props: NamedViewProps) => <EmbeddedDiagram views={LikeC4ViewsData} viewId={'${id}'} {...props}/>
      //     `,
      //   {
      //     separator: ',',
      //     appendNewLineIfNotEmpty: true
      //   }
      // )],
    })
    .append('} as const', NL, NL)

  return toString(out)
}
