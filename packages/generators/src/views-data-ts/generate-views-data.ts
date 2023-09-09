import type { DiagramView } from '@likec4/core'
import JSON5 from 'json5'
import { CompositeGeneratorNode, NL, expandToNode, joinToNode, toString } from 'langium'
import { generateViewId } from '../react/generate-react'

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

  if (views.length == 0) {
    out.append('export {}', NL)
    return toString(out)
  }

  out.appendTemplate`
    export type LikeC4ViewId = ${generateViewId(views)};
    export const LikeC4Views = {
  `
    .indent({
      indentation: 2,
      indentedChildren(indented) {
        indented.appendNewLineIf(views.length > 1).append(
          joinToNode(
            views,
            view => expandToNode`${JSON5.stringify(view.id)}: (${JSON5.stringify(view)} as unknown) as DiagramView`,
            {
              separator: ',',
              appendNewLineIfNotEmpty: true
            }
          )
        )
      }
    })
    .append('} as const satisfies Record<LikeC4ViewId, DiagramView>', NL, NL).appendTemplate`
    export type LikeC4Views = typeof LikeC4Views

    export function isLikeC4ViewId(value: unknown): value is LikeC4ViewId {
      return (
        value != null &&
        typeof value === 'string' &&
        Object.prototype.hasOwnProperty.call(LikeC4Views, value)
      )
    }

    // Re-export types
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
