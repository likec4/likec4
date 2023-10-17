import { AnimatedRect, Text } from '../../konva'
import { NodeLabels } from './NodeLabel'
import { useShadowSprings } from '../springs'
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
      {/* <ExternalLink
              x={-2}
              y={30}
              fill={scale(colors.fill, { s: -10, l: 3 })}
              fillIcon={colors.loContrast}
              {...toolbarProps}
            /> */}
      {/*
      <Text
        x={8}
        y={node.size.height}
        offsetY={18}
        fill={colors.loContrast}
        align='center'
        fontFamily={theme.font}
        fontSize={10}
        text={'#' + node.id}
        strokeEnabled={false}
        perfectDrawEnabled={false}
        listening={false}
        globalCompositeOperation='luminosity'
      /> */}
    </>
  )
}
