import { AnimatedRect, Circle } from '../../konva'
import { NodeLabels } from './NodeLabel'
import { useShadowSprings } from '../springs'
import type { NodeShapeProps } from './types'
import { NodeIcon } from './NodeIcon'

export function MobileShape({ node, theme, springs, isHovered }: NodeShapeProps) {
  const colors = theme.elements[node.color]
  // 40 - padding left and right
  // 30 - padding of the icon
  const maxWidth = node.size.width - 40 - 30
  return (
    <>
      <AnimatedRect
        {...useShadowSprings(isHovered, theme, springs)}
        cornerRadius={6}
        width={springs.width}
        height={springs.height}
        fill={springs.stroke}
      />
      <Circle x={16} y={node.size.height / 2} radius={10} fill={colors.fill} listening={false} />
      <AnimatedRect
        cornerRadius={4}
        x={31}
        y={12}
        width={springs.width.to(w => w - 43)}
        height={springs.height.to(h => h - 24)}
        fill={springs.fill}
        listening={false}
      />
      <NodeLabels node={node} theme={theme} offsetX={-10} maxWidth={maxWidth} />
      <NodeIcon node={node} offsetX={-10} maxWidth={maxWidth} />
    </>
  )
}
