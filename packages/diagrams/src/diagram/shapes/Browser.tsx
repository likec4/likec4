import { useShadowSprings } from '../springs'
import { AnimatedRect, Circle } from '../../konva'
import { NodeLabels } from './NodeLabel'
import type { NodeShapeProps } from './types'

export function BrowserShape({ node, theme, springs, isHovered }: NodeShapeProps) {
  const colors = theme.colors[node.color]

  return (
    <>
      <AnimatedRect
        {...useShadowSprings(isHovered, theme, springs)}
        cornerRadius={6}
        perfectDrawEnabled={false}
        strokeEnabled={false}
        width={springs.width}
        height={springs.height}
        fill={springs.stroke}
      />
      <Circle x={16} y={15} radius={7} fill={colors.fill} listening={false} />
      <Circle x={36} y={15} radius={7} fill={colors.fill} listening={false} />
      <Circle x={56} y={15} radius={7} fill={colors.fill} listening={false} />
      <AnimatedRect
        cornerRadius={5}
        x={70}
        y={7}
        width={springs.width.to(w => w - 80)}
        height={16}
        fill={springs.fill}
        listening={false}
      />
      <AnimatedRect
        cornerRadius={5}
        x={9}
        y={31}
        width={springs.width.to(w => w - 18)}
        height={springs.height.to(h => h - 40)}
        fill={springs.fill}
        listening={false}
      />
      <NodeLabels node={node} theme={theme} offsetY={-8} />
    </>
  )
}
