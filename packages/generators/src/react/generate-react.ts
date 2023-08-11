import type { DiagramView } from '@likec4/core/types'
import JSON5 from 'json5'
import {
  CompositeGeneratorNode,
  NL,
  expandToNode,
  joinToNode,
  toString
} from 'langium/lib/generator'

const componentName = (value: string): string => {
  if (!value.charAt(0).match(/[a-zA-Z]/)) {
    value = 'View' + value
  }
  value = value.replaceAll('_', '')
  return value.charAt(0).toLocaleUpperCase() + value.slice(1)
}

export function generateReact(views: DiagramView[]) {
  const components = views.map(({ id }) => {
    return {
      id,
      name: componentName(id)
    }
  })

  const out = new CompositeGeneratorNode()
  out.appendTemplate`
      /******************************************************************************
       * This file was generated
       * DO NOT EDIT MANUALLY!
       ******************************************************************************/
      /* eslint-disable */

      import type { DiagramView } from '@likec4/core'
      import { LikeC4 } from '@likec4/diagrams'
    `.append(NL, NL)

  if (components.length == 0) {
    out.append('export {}', NL)
    return toString(out)
  }

  out
    .append('export const LikeC4Views = {', NL)
    .indent({
      indentation: 2,
      indentedChildren: indent => {
        indent.append(
          joinToNode(
            views,
            view =>
              expandToNode`'${view.id}': (${JSON5.stringify(view)} as unknown) as DiagramView`,
            {
              separator: ',',
              appendNewLineIfNotEmpty: true
            }
          )
        )
      }
    })
    .append('} as const', NL, NL).appendTemplate`
      export type LikeC4Views = typeof LikeC4Views
      export type LikeC4ViewId = keyof LikeC4Views

      export const {
        isViewId,
        Diagram,
        Responsive,
        Embedded,
        Browser
      } = LikeC4.create(LikeC4Views)
    `.append(NL, NL).appendTemplate`
      export type {
        DiagramApi
      } from '@likec4/diagrams'

      export type {
        Fqn,
        Element,
        RelationID,
        Relation,
        NodeId,
        EdgeId,
        ComputedNode,
        ComputedEdge,
        ComputedView,
        DiagramView,
        DiagramNode,
        DiagramEdge,
        DiagramLabel
      } from '@likec4/core'
    `.append(NL, NL)

  return toString(out)
}
