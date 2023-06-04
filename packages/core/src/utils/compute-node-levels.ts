import invariant from 'tiny-invariant'
import type { ComputedNode, ComputedView, NodeId } from '../types/computed-view'

type NodeLevelDepth = {
  level: number
  depth: number
}

export const computeNodeLevels = ({ nodes }: ComputedView) => {
  const nodeLevels = {} as Record<NodeId, NodeLevelDepth>

  const compute = (node: ComputedNode, level: number): NodeLevelDepth => {
    let levels = nodeLevels[node.id]
    if (levels) {
      return levels
    }
    if (node.children.length === 0) {
      levels = { level, depth: 0 }
      nodeLevels[node.id] = levels
      return levels
    }
    let depth = 1
    for (const childId of node.children) {
      const child = nodes.find(n => n.id === childId)
      invariant(child, `Child ${childId} not found`)
      const { depth: childDepth } = compute(child, level + 1)
      depth = Math.max(childDepth + 1, depth)
    }
    levels = { level, depth }
    nodeLevels[node.id] = levels
    return levels
  }

  for (const node of nodes) {
    if (!node.parent) {
      compute(node, 0)
    }
  }

  return nodeLevels
}
