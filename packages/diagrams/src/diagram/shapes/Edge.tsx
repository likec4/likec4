/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/prefer-ts-expect-error */
import { useSpring, type SpringValues } from '@react-spring/konva'
import { AnimatedLine, AnimatedRect, AnimatedText } from '../../konva'

import type { BBox } from '@likec4/core'
import type { KonvaNodeEvents } from 'react-konva/es/ReactKonvaCore'
import type { DiagramEdge, LikeC4Theme } from '../types'

// const lineColor = '#6E6E6E'
// const labelBgColor = '#18191b'
// const labelColor = '#C6C6C6'
function EdgeLabelBg({
  animate,
  labelBBox,
  isHovered,
  springs
}: {
  animate: boolean
  labelBBox: BBox
  isHovered: boolean
  springs: EdgeShapeProps['springs']
}) {
  const props = useSpring({
    to: {
      x: labelBBox.x - 4,
      y: labelBBox.y - 4,
      width: labelBBox.width + 8,
      height: labelBBox.height + 8,
      opacity: isHovered ? 0.25 : 0.1
    },
    immediate: !animate
  })
  return (
    <AnimatedRect
      {...props}
      fill={springs.labelBgColor}
      cornerRadius={2}
      globalCompositeOperation='darken'
      hitStrokeWidth={5}
    />
  )
}

export interface EdgeShapeProps extends KonvaNodeEvents {
  animate?: boolean | undefined
  edge: DiagramEdge
  theme: LikeC4Theme
  isHovered: boolean
  springs: SpringValues<{
    lineColor: string
    lineWidth: number
    opacity: number
    labelBgColor: string
    labelColor: string
  }>
}
export function EdgeShape({ animate = true, edge, theme, isHovered, springs }: EdgeShapeProps) {
  const { points, headArrow, labelBBox, labels } = edge

  return (
    <>
      <AnimatedLine
        opacity={springs.opacity}
        bezier={true}
        dashEnabled={true}
        points={points.flat()}
        dash={[8, 4]}
        stroke={springs.lineColor}
        strokeWidth={springs.lineWidth}
        hitStrokeWidth={20}
        globalCompositeOperation={'luminosity'}
      />
      {headArrow && (
        <AnimatedLine
          opacity={springs.opacity}
          points={headArrow.flat()}
          closed={true}
          fill={springs.lineColor}
          stroke={springs.lineColor}
          strokeWidth={1}
          hitStrokeWidth={5}
          globalCompositeOperation={'luminosity'}
        />
      )}
      {labelBBox && labelBBox.width > 0 && (
        <EdgeLabelBg
          animate={animate}
          labelBBox={labelBBox}
          isHovered={isHovered}
          springs={springs}
        />
      )}
      {labels &&
        labels.map((label, i) => (
          <AnimatedText
            key={i}
            x={label.pt[0]}
            y={label.pt[1]}
            offsetY={label.fontSize / 2}
            opacity={springs.opacity}
            fill={springs.labelColor}
            fontFamily={theme.font}
            fontSize={label.fontSize}
            fontStyle={label.fontStyle ?? 'normal'}
            text={label.text}
            perfectDrawEnabled={false}
            listening={false}
            globalCompositeOperation='luminosity'
            shadowEnabled={springs.opacity.to(o => o > 0.5)}
            shadowColor={'#222'}
            shadowOpacity={0.15}
            shadowOffsetX={1}
            shadowOffsetY={2}
            shadowBlur={2}
          />
        ))}
    </>
  )
}
