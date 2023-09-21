import { AnimatedRect } from '../../konva'
import { NodeLabels } from './Node-Labels'
import { useShadowSprings } from '../springs'
import type { NodeShapeProps } from './types'

export function RectangleShape({ node, theme, springs, isHovered }: NodeShapeProps) {
  return (
    <>
      <AnimatedRect
        {...useShadowSprings(isHovered, springs)}
        cornerRadius={6}
        strokeEnabled={false}
        width={springs.width}
        height={springs.height}
        fill={springs.fill}
        // strokeEnabled={isHovered === true}
        // shadowForStrokeEnabled={false}
        // stroke={'#F8F3D4'}
        // strokeScaleEnabled={false}
        // strokeWidth={2}
      />
      <NodeLabels node={node} theme={theme} />
      {/* <ExternalLink
              x={-2}
              y={30}
              fill={scale(colors.fill, { s: -10, l: 3 })}
              fillIcon={colors.loContrast}
              {...toolbarProps}
            /> */}
    </>
  )
}
