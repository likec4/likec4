/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/prefer-ts-expect-error */
import type { SpringValues } from '@react-spring/konva'
import { AnimatedCircle, AnimatedLine, AnimatedText, Rect } from '../../konva'

import { hasAtLeast, invariant, nonNullable } from '@likec4/core'
import type { KonvaNodeEvents } from 'react-konva/es/ReactKonvaCore'
import type { DiagramEdge, LikeC4Theme } from '../types'

export interface EdgeShapeProps extends KonvaNodeEvents {
  edge: DiagramEdge
  theme: LikeC4Theme
  isHovered: boolean
  springs: SpringValues<{
    lineColor: string
    lineWidth: number
    opacity: number
    labelColor: string
  }>
}

export function EdgeShape({ edge, theme, isHovered, springs }: EdgeShapeProps) {
  const { points, headArrow, labelBBox: labelBg, labels } = edge

  invariant(hasAtLeast(points, 1), 'Edge must have at least one point')
  const [x, y] = points[0]

  return (
    <>
      <AnimatedLine
        opacity={springs.opacity}
        bezier={true}
        dashEnabled={true}
        points={points.flat()}
        dash={[8, 4]}
        dashOffset={isHovered ? -5 : 0}
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
      {labelBg.width > 0 && (
        <Rect
          x={labelBg.x - 5}
          y={labelBg.y - 5}
          width={labelBg.width + 10}
          height={labelBg.height + 10}
          fill={'#555'}
          cornerRadius={4}
          opacity={isHovered ? 0.3 : 0.05}
          globalCompositeOperation='color-burn'
          hitStrokeWidth={5}
        />
      )}
      {labels.map((label, i) => (
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
          hitStrokeWidth={10}
          listening={false}
          shadowEnabled
          globalCompositeOperation='luminosity'
          // // shadowForStrokeEnabled
          shadowColor={'#000'}
          shadowOpacity={0.1}
          shadowOffsetX={1}
          shadowOffsetY={2}
          shadowBlur={2}
        />
      ))}
    </>
  )
}
