import type { DynamicViewFlow, StepPath } from '@likec4/core/types'
import { useMemo } from 'react'
import { type OutlineTreeNodeData, type OutlineTreeNodeFlow, type OutlineTreeNodes, isOutlineFlowNode } from './types'

/** Flattens the walkthrough flow into the nested step/sub-flow tree the outline renders. */
export function buildTree(flow: DynamicViewFlow): OutlineTreeNodes {
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
          edge: edge,
        },
      })
    },
    subflow: ({ subflow }) => {
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

export function useTreeData(flow: DynamicViewFlow): OutlineTreeNodes {
  return useMemo(() => buildTree(flow), [flow])
}

/** The first step inside a fragment — where the breadcrumb jumps to. */
export function firstStepOf(nodes: OutlineTreeNodes): StepPath | null {
  for (const node of nodes) {
    if (isOutlineFlowNode(node)) {
      const found = firstStepOf(node.children)
      if (found) return found
    } else {
      return node.value
    }
  }
  return null
}

/** The chain of sub-flows the active step is nested inside, outermost first. */
export function collectTrail(nodes: OutlineTreeNodes, ancestors: readonly string[]): OutlineTreeNodeFlow[] {
  const trail: OutlineTreeNodeFlow[] = []
  const walk = (list: OutlineTreeNodes) => {
    for (const node of list) {
      if (isOutlineFlowNode(node) && ancestors.includes(node.value)) {
        trail.push(node)
        walk(node.children)
        return
      }
    }
  }
  walk(nodes)
  return trail
}
