import { type DynamicViewFlow, type scalar, type StepPath } from '@likec4/core'

import type { TreeNodeData } from '@mantine/core'
import { useMemo } from 'react'
import type { DiagramContext } from '../../state/types'

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

function buildTree(flow: DynamicViewFlow, collapsedFlows: DiagramContext['collapsedSequenceFlows']): OutlineTreeNodes {
  const tree: OutlineTreeNodeData[] = []
  let currentFlow: OutlineTreeNodeData[] = tree

  let isCollapsed = false

  flow.walk({
    step: ({ step, stepnum, source, target, edge }) => {
      // Skip steps if we're in a collapsed subflow
      // We need stepnum to track the global step number even when collapsed
      if (isCollapsed) {
        return
      }
      currentFlow.push({
        label: edge.label ?? `${source.title} → ${target.title}`,
        value: step,
        nodeProps: {
          type: 'step',
          stepnum: stepnum.global,
          source: source.title,
          target: target.title,
          label: edge.label,
          notes: edge.notes ?? null,
        },
      })
    },
    subflow: ({ subflow }) => {
      if (collapsedFlows[subflow.id]) {
        isCollapsed = true
        return () => {
          isCollapsed = false
        }
      }
      const node: OutlineTreeNodeFlow = {
        label: subflow.title ?? subflow._type,
        value: subflow.id,
        nodeProps: {
          type: subflow._type,
          title: subflow.title,
        },
        children: [],
      }
      const parent = currentFlow
      parent.push(node)
      currentFlow = node.children
      // restore parent on leave
      return () => {
        currentFlow = parent
      }
    },
  })
  return tree
}

export function useTreeData(
  flow: DynamicViewFlow,
  collapsed: DiagramContext['collapsedSequenceFlows'],
): OutlineTreeNodes {
  return useMemo(() => buildTree(flow, collapsed), [flow, collapsed])
}
