import type { DiagramNode } from './types'

export function defaultNodeSprings(node: DiagramNode) {
  return {
    opacity: 1,
    scale: 1,
    x: node.position[0],
    y: node.position[1],
    width: node.size.width,
    height: node.size.height
  }
}
export type NodeState = ReturnType<typeof defaultNodeSprings>

export function nodeSprings(overrides?: { opacity?: number; scale?: number }) {
  if (overrides == null) {
    return defaultNodeSprings as unknown as NodeState
  }
  const nodesprings = (node: DiagramNode) => ({
    ...defaultNodeSprings(node),
    ...overrides
  })
  return nodesprings as unknown as NodeState
}
