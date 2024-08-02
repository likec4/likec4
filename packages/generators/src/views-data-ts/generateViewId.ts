import type { DiagramView } from '@likec4/core'
import JSON5 from 'json5'
import { expandToNode, joinToNode } from 'langium/generate'

export function generateViewId(views: Iterable<DiagramView>) {
  return joinToNode(views, view => expandToNode`${JSON5.stringify(view.id)}`, {
    separator: ' | '
  })
}
