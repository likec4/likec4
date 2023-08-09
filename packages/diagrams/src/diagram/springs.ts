import type { Controller, GoalValues } from '@react-spring/konva'
import type { DiagramNode } from './types'

function defaultNodeSprings(
  { position: [x, y], size: { width, height } }: DiagramNode,
  _index: number
) {
  const offsetX = Math.round(width / 2)
  const offsetY = Math.round(height / 2)
  return {
    opacity: 1,
    scaleX: 1,
    scaleY: 1,
    x: x + offsetX,
    y: y + offsetY,
    width,
    height,
    offsetX,
    offsetY
  }
}
export type NodeSprings = ReturnType<typeof defaultNodeSprings>
export type NodeSpringsFn = (node: DiagramNode, index: number) => GoalValues<NodeSprings>

export type NodeSpringsCtrl = Controller<NodeSprings>

export function nodeSprings(overrides?: { opacity?: number; scale?: number }): NodeSpringsFn {
  if (overrides == null) {
    return defaultNodeSprings
  }
  const { opacity, scale } = overrides
  return (node: DiagramNode, _index: number) => {
    const defaults = defaultNodeSprings(node, _index)
    return {
      ...defaults,
      opacity: opacity ?? defaults.opacity,
      scaleX: scale ?? defaults.scaleX,
      scaleY: scale ?? defaults.scaleY
    }
  }
}
