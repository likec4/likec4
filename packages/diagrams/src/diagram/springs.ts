import type { Controller, GoalValues, SpringValues } from '@react-spring/konva'
import type { DiagramNode } from './types'
import { useSpring } from '@react-spring/konva'
import { defaultTheme as theme } from '@likec4/core'
import { scale, toHex } from 'khroma'
import { memoize } from 'rambdax'

const compoundColor = memoize((color: string, level: number) =>
  toHex(
    scale(color, {
      l: level > 0 ? -45 : -55,
      s: level > 0 ? -30 : -35
    })
  )
)

const isCompound = (node: DiagramNode) => {
  return node.children.length > 0
}

export function defaultNodeSprings(node: DiagramNode) {
  const {
    position: [x, y],
    size: { width, height },
    color
  } = node
  const colors = theme.colors[color]
  const offsetX = Math.round(width / 2)
  const offsetY = Math.round(height / 2)
  return {
    opacity: 1,
    scaleX: 1,
    scaleY: 1,
    x: x + offsetX,
    y: y + offsetY,
    fill: isCompound(node) ? compoundColor(colors.fill, node.level) : colors.fill,
    stroke: isCompound(node) ? compoundColor(colors.stroke, node.level) : colors.stroke,
    width,
    height,
    offsetX,
    offsetY
  }
}
export interface NodeSprings extends ReturnType<typeof defaultNodeSprings> {
  // Make as interface for better type inference
}
export type NodeSpringValues = SpringValues<NodeSprings>
export type NodeSpringsFn = (node: DiagramNode, index: number) => GoalValues<NodeSprings>

export type NodeSpringsCtrl = Controller<NodeSprings>

export function nodeSprings(overrides?: { opacity?: number; scale?: number }): NodeSpringsFn {
  if (overrides == null) {
    return defaultNodeSprings
  }
  const { opacity, scale } = overrides
  return (node: DiagramNode) => {
    const defaults = defaultNodeSprings(node)
    return {
      ...defaults,
      opacity: opacity ?? defaults.opacity,
      scaleX: scale ?? defaults.scaleX,
      scaleY: scale ?? defaults.scaleY
    }
  }
}

export const useShadowSprings = (isHovered = false, springs: NodeSpringValues) => {
  const [values] = useSpring(
    {
      shadowBlur: isHovered ? 22 : 16,
      shadowOpacity: isHovered ? 0.45 : 0.25,
      shadowOffsetX: 0,
      shadowOffsetY: isHovered ? 16 : 10,
      shadowColor: theme.shadow
    },
    [isHovered]
  )
  return {
    shadowEnabled: springs.opacity.to(v => v > 0.8),
    ...values
  }
}
