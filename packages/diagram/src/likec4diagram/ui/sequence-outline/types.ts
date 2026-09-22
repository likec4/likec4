import type { DiagramEdge, DynamicViewFlow, scalar, StepPath } from '@likec4/core/types'
import type { TreeNodeData } from '@mantine/core'
import type { DiagramContext } from '../../state/types'

/** Sub-flows the user has folded away, keyed by {@link StepPath}. */
export type CollapsedFlows = DiagramContext['collapsedSequenceFlows']

export interface OutlineTreeNodeStep extends TreeNodeData {
  readonly value: StepPath
  readonly nodeProps: Readonly<{
    readonly type: 'step'
    /** Global step number (1-based) across all flows */
    readonly stepnum: number
    /** Title of the source actor */
    readonly source: string
    /** Title of the target actor */
    readonly target: string
    /** Relationship label, if any */
    readonly label: string | null
    readonly notes: scalar.MarkdownOrString | null
    readonly edge: DiagramEdge
  }>
}

export interface OutlineTreeNodeFlow extends TreeNodeData {
  readonly value: StepPath
  readonly nodeProps: Readonly<{
    readonly type: DynamicViewFlow.SubFlowType
    /** Friendly title of the sub-flow, if defined */
    readonly title: string | undefined
  }>
  children: OutlineTreeNodeData[]
}

export type OutlineTreeNodeData = OutlineTreeNodeStep | OutlineTreeNodeFlow

export type OutlineTreeNodes = OutlineTreeNodeData[]

/**
 * Type guard narrowing a tree node to a sub-flow node.
 * (The discriminant lives on the nested `nodeProps.type`, so an explicit guard
 * is needed for reliable narrowing.)
 */
export function isOutlineFlowNode(node: OutlineTreeNodeData): node is OutlineTreeNodeFlow {
  return node.nodeProps.type !== 'step'
}
