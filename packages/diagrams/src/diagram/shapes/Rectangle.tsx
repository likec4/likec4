import { AnimatedRect } from '../../konva'
import { useShadowSprings } from '../springs'
import { NodeIcon } from './NodeIcon'
import { NodeLabels } from './NodeLabel'
import type { NodeShapeProps } from './types'

export function RectangleShape({ node, theme, springs, isHovered }: NodeShapeProps) {
  return (
    <>
      <AnimatedRect
        {...useShadowSprings(isHovered, theme, springs)}
        cornerRadius={6}
        strokeEnabled={false}
        width={springs.width}
        height={springs.height}
        fill={springs.fill}
        // globalCompositeOperation={'screen'}
        // strokeEnabled={isHovered === true}
        // shadowForStrokeEnabled={false}
        // stroke={'#F8F3D4'}
        // strokeScaleEnabled={false}
        // strokeWidth={2}
      />
      <NodeLabels node={node} theme={theme} />
      <NodeIcon node={node} />
    </>
  )
}
