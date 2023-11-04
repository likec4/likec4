import { AnimatedCircle, AnimatedRect } from '../../konva'
import { useShadowSprings } from '../springs'
import { NodeIcon } from './NodeIcon'
import { NodeLabels } from './NodeLabel'
import type { NodeShapeProps } from './types'

export function BrowserShape({ node, theme, springs, isHovered }: NodeShapeProps) {
  return (
    <>
      <AnimatedRect
        {...useShadowSprings(isHovered, theme, springs)}
        cornerRadius={6}
        strokeEnabled={false}
        width={springs.width}
        height={springs.height}
        fill={springs.stroke}
        perfectDrawEnabled={false}
      />
      <AnimatedCircle
        x={16}
        y={15}
        radius={7}
        fill={springs.fill}
        listening={false}
        perfectDrawEnabled={false}
      />
      <AnimatedCircle
        x={36}
        y={15}
        radius={7}
        fill={springs.fill}
        listening={false}
        perfectDrawEnabled={false}
      />
      <AnimatedCircle
        x={56}
        y={15}
        radius={7}
        fill={springs.fill}
        listening={false}
        perfectDrawEnabled={false}
      />
      <AnimatedRect
        cornerRadius={5}
        x={70}
        y={7}
        width={springs.width.to(w => w - 80)}
        height={16}
        fill={springs.fill}
        listening={false}
        perfectDrawEnabled={false}
      />
      <AnimatedRect
        cornerRadius={5}
        x={9}
        y={31}
        width={springs.width.to(w => w - 18)}
        height={springs.height.to(h => h - 40)}
        fill={springs.fill}
        listening={false}
        perfectDrawEnabled={false}
      />
      <NodeLabels node={node} theme={theme} offsetY={-6} />
      <NodeIcon node={node} paddingY={42} />
    </>
  )
}
