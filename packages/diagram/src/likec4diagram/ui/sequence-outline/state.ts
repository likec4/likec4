import {
  type StoreFromStoreLogicCreator,
  createStoreLogic,
} from '@xstate/store'

import { type DynamicViewFlow, type StepPath, flowAncestors } from '@likec4/core'

import type { TreeNodeData } from '@mantine/core'

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
      count += countSteps(node.children)
    } else {
      count++
    }
  }
  return count
}

export type OutlineState = {
  flow: DynamicViewFlow
  tree: OutlineTreeNodeData[]
  expandedValue: string[]
  activeStep: StepPath
}

function buildTree(flow: DynamicViewFlow) {
  const tree: OutlineTreeNodeData[] = []
  // Sub-flow nodes are patched with their step count on leave (children are known by then).
  const flowNodes: OutlineTreeNodeFlow[] = []

  let currentNode: OutlineTreeNodeData[] = tree

  flow.walk({
    step: ({ step, stepnum, source, target, edge }) => {
      currentNode.push({
        label: edge.label ?? `${source.title} → ${target.title}`,
        value: step,
        nodeProps: {
          type: 'step',
          stepnum: stepnum.global,
          source: source.title,
          target: target.title,
          label: edge.label,
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
          stepCount: 0,
        },
        children: [],
      }
      flowNodes.push(node)
      const parent = currentNode
      parent.push(node)
      currentNode = node.children
      // restore parent on leave
      return () => {
        currentNode = parent
      }
    },
  })

  // Fill in step counts now that the tree is fully built.
  for (const node of flowNodes) {
    ;(node.nodeProps as { stepCount: number }).stepCount = countSteps(node.children)
  }

  return tree
}

// export const createOutlineStore = ({
//   flow,
//   // sideEffects,
// }: {
//   flow: DynamicViewFlow
//   // sideEffects: {
//   //   onElementStateClick: (payload: { id: Fqn }) => void
//   // }
// }) =>
export const outlineStore = createStoreLogic({
  context: ({
    flow,
    activeStep,
    // sideEffects,
  }: {
    flow: DynamicViewFlow
    activeStep: StepPath
    // sideEffects: {
    //   onElementStateClick: (payload: { id: Fqn }) => void
    // }
  }): OutlineState => ({
    flow,
    activeStep,
    tree: buildTree(flow),
    expandedValue: flowAncestors(activeStep),
  }),
  // schemas: {
  //   emitted: {
  //     flavorChanged: z.object({
  //       flavor: z.string(),
  //     }),
  //   },
  // },
  on: {
    updateFlow: (context, event: { flow: DynamicViewFlow }) => {
      if (context.flow === event.flow) {
        return context
      }
      return {
        ...context,
        flow: event.flow,
        tree: buildTree(event.flow),
      }
    },
    changeActiveStep: (context, event: { step: StepPath }) => {
      return {
        ...context,
        activeStep: event.step,
      }
    },
  },
})

export type OutlineStore = StoreFromStoreLogicCreator<typeof outlineStore>
