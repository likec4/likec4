import type { AbstractRelation, ViewId } from '@likec4/core'
import type { Edge as ReactFlowEdge } from '@xyflow/react'
import type { SetRequired } from 'type-fest'

export namespace XYFlowTypes {

  type EdgeData = {
    technology: string | null
    description: string | null
    relations: [AbstractRelation, ...AbstractRelation[]]
    // relation: Relation
    navigateTo: ViewId | null
    hovered?: boolean
    dimmed?: boolean
  }

  export type Edge = SetRequired<ReactFlowEdge<EdgeData, 'relation'>, 'data' | 'type'>
}
