import type { Controller, GoalValues, SpringValues } from '@react-spring/konva'
import { useSpring } from '@react-spring/konva'
import { scale, toHex } from 'khroma'
import { memoize } from 'rambdax'
import { useCallback } from 'react'
import type { DiagramNode, DiagramTheme } from './types'

const compoundColor = memoize((color: string, depth: number) =>
  toHex(
    scale(color, {
      l: -35 - 5 * depth,
      s: -15 - 5 * depth
    })
  )
)

const isCompound = (node: DiagramNode) => {
  return node.children.length > 0
}

function nodeSprings(theme: DiagramTheme, node: DiagramNode) {
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
    fill: isCompound(node) ? compoundColor(colors.fill, node.depth ?? 1) : colors.fill,
    stroke: isCompound(node) ? compoundColor(colors.stroke, node.depth ?? 1) : colors.stroke,
    width,
    height,
    offsetX,
    offsetY
  }
}
export interface NodeSprings extends ReturnType<typeof nodeSprings> {
  // Make as interface for better type inference
}
export type NodeSpringValues = SpringValues<NodeSprings>
export type NodeSpringsFn = (node: DiagramNode, index: number) => GoalValues<NodeSprings>

export type NodeSpringsCtrl = Controller<NodeSprings>

export const useNodeSpringsFn = (theme: DiagramTheme) => {
  return useCallback((node: DiagramNode) => nodeSprings(theme, node), [theme])
}

export const useShadowSprings = (
  isHovered = false,
  theme: DiagramTheme,
  springs: NodeSpringValues
) => {
  const [values] = useSpring(
    {
      shadowBlur: isHovered ? 30 : 12,
      shadowOpacity: isHovered ? 0.5 : 0.35,
      shadowOffsetX: 0,
      shadowOffsetY: isHovered ? 16 : 4,
      shadowColor: theme.shadow
    },
    [isHovered, theme]
  )
  return {
    shadowEnabled: springs.opacity.to(v => v > 0.8),
    ...values
  }
}
