import type { DiagramView } from '@likec4/core'
import JSON5 from 'json5'
import { CompositeGeneratorNode, NL, expandToNode, joinToNode, toString } from 'langium'

export function generateViewsDataTs(views: DiagramView[]) {
  const out = new CompositeGeneratorNode()
  out.appendTemplate`
      /******************************************************************************
       * This file was generated
       * DO NOT EDIT MANUALLY!
       ******************************************************************************/
      /* eslint-disable */

      import type { DiagramView } from '@likec4/core'
    `.append(NL, NL)

  out
    .append('export const LikeC4Views = {', NL)
    .indent({
      indentation: 2,
      indentedChildren: indent => {
        indent.append(
          joinToNode(views, view => expandToNode`'${view.id}': (${JSON5.stringify(view)} as unknown) as DiagramView`, {
            separator: ',',
            appendNewLineIfNotEmpty: true
          })
        )
      }
    })
    .append('} as const', NL, NL).appendTemplate`
      export type LikeC4Views = typeof LikeC4Views
      export type LikeC4ViewId = keyof LikeC4Views

      export function isLikeC4ViewId(value: unknown): value is LikeC4ViewId {
        return (
          value != null &&
          typeof value === 'string' &&
          Object.prototype.hasOwnProperty.call(LikeC4Views, value)
        )
      }
    `.append(NL, NL).appendTemplate`
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
