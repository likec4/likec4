import { AnimatedRect, Circle } from '../../konva'
import { NodeLabels } from './NodeLabel'
import { useShadowSprings } from '../springs'
import type { NodeShapeProps } from './types'

export function MobileShape({ node, theme, springs, isHovered }: NodeShapeProps) {
  const colors = theme.elements[node.color]

  // const [toolbarProps, toggleToolbar] = useNodeToolbarSpring()
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
      <NodeLabels node={node} theme={theme} offsetX={-6} />
    </>
  )
}
