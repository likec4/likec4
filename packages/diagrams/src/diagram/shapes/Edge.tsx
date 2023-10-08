/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/prefer-ts-expect-error */
import type { SpringValues } from '@react-spring/konva'
import { AnimatedCircle, AnimatedLine, AnimatedText } from '../../konva'

import { invariant, nonNullable } from '@likec4/core'
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
  const { points, headArrow, labels } = edge

  invariant(points[0], 'Edge must have at least one point')
  const [x, y] = nonNullable(points[0])

  return (
    <>
      <AnimatedCircle
        opacity={springs.opacity}
        x={x}
        y={y}
        radius={springs.lineWidth.to(v => v + 1)}
        fill={springs.lineColor}
        visible={isHovered}
      />
      <AnimatedLine
        opacity={springs.opacity}
        bezier={true}
        dashEnabled={true}
        points={points.flat()}
        stroke={springs.lineColor}
        strokeWidth={springs.lineWidth}
        hitStrokeWidth={20}
      />
      {headArrow && (
        <AnimatedLine
          opacity={springs.opacity}
          points={headArrow.flat()}
          closed={true}
          fill={springs.lineColor}
          stroke={springs.lineColor}
          strokeWidth={2}
          hitStrokeWidth={5}
        />
      )}
      {labels.map((label, i) => (
        <AnimatedText
          key={i}
          x={label.pt[0] - 4}
          y={label.pt[1] - label.fontSize / 2 - 4}
          opacity={springs.opacity}
          padding={4}
          fill={springs.labelColor}
          fontFamily={theme.font}
          fontSize={label.fontSize}
          fontStyle={label.fontStyle ?? 'normal'}
          align={label.align}
          text={label.text}
          perfectDrawEnabled={false}
          hitStrokeWidth={10}
        />
      ))}
    </>
  )
}
