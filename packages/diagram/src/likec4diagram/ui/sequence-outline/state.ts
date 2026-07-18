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
    /** Number of steps (leaf messages) nested under this sub-flow */
    readonly stepCount: number
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

/**
 * Recursively counts the leaf steps (messages) under a list of tree nodes.
 */
export function countSteps(nodes: OutlineTreeNodeData[]): number {
  let count = 0
  for (const node of nodes) {
    if (isOutlineFlowNode(node)) {
      count += node.nodeProps.stepCount
    } else {
      count++
    }
  }
  return count
}

function buildTree(flow: DynamicViewFlow, collapsedFlows: DiagramContext['collapsedSequenceFlows']): OutlineTreeNodes {
  const tree: OutlineTreeNodeData[] = []
  let currentFlow: OutlineTreeNodeData[] = tree

  flow.walk({
    step: ({ step, stepnum, source, target, edge }) => {
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
        return false
      }
      const node: OutlineTreeNodeFlow = {
        label: subflow.title ?? subflow._type,
        value: subflow.id,
        nodeProps: {
          type: subflow._type,
          title: subflow.title,
          stepCount: 0,
        },
        children: [],
      }
      const parent = currentFlow
      parent.push(node)
      currentFlow = node.children
      // restore parent on leave
      return () => {
        ;(node.nodeProps as { stepCount: number }).stepCount = countSteps(node.children)
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
