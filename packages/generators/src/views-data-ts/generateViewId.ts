import type { DiagramView } from '@likec4/core'
import { expandToNode, joinToNode } from 'langium/generate'

export function generateViewId(views: Iterable<DiagramView>) {
  return joinToNode(views, view => expandToNode`'${view.id}'`, {
    separator: ' | '
  })
}
