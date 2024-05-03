import { AnimatedCircle, AnimatedRect, Circle } from '../../konva'
import { useShadowSprings } from '../springs'
import { NodeIcon } from './NodeIcon'
import { NodeLabels } from './NodeLabel'
import type { NodeShapeProps } from './types'

export function MobileShape({ node, theme, springs, isHovered }: NodeShapeProps) {
  const colors = theme.elements[node.color]
  // 40 - padding left and right
  // 30 - padding of the icon
  const maxWidth = node.width - 40 - 30
  return (
    <>
      <AnimatedRect
        {...useShadowSprings(isHovered, theme, springs)}
        cornerRadius={6}
        width={springs.width}
        height={springs.height}
        fill={springs.stroke}
        perfectDrawEnabled={false}
      />
      <AnimatedCircle
        x={16}
        y={node.height / 2}
        radius={10}
        fill={springs.fill}
        listening={false}
        perfectDrawEnabled={false}
      />
      <AnimatedRect
        cornerRadius={4}
        x={31}
        y={12}
        width={springs.width.to(w => w - 43)}
        height={springs.height.to(h => h - 24)}
        fill={springs.fill}
        perfectDrawEnabled={false}
        listening={false}
      />
      <NodeLabels node={node} theme={theme} offsetX={-10} maxWidth={maxWidth} />
      <NodeIcon node={node} offsetX={-10} maxWidth={maxWidth} />
    </>
  )
}
