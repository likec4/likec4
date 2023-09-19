/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/prefer-ts-expect-error */
import type { SpringValues } from '@react-spring/konva'
import { Fragment } from 'react'
import { AnimatedCircle, AnimatedLine, AnimatedText } from '../../konva'

import { invariant } from '@likec4/core'
import type { KonvaNodeEvents } from 'react-konva/es/ReactKonvaCore'
import type { DiagramEdge, LikeC4Theme } from '../types'

export interface EdgeShapeProps extends KonvaNodeEvents {
  edge: DiagramEdge
  theme: LikeC4Theme
  springs: SpringValues<{
    lineColor: string
    width: number
    opacity: number
  }>
}

export function EdgeShape({ edge, theme, springs, ...listeners }: EdgeShapeProps) {
  const { points, headArrow, labels } = edge

  const startPoint = points[0]
  invariant(startPoint, 'Edge must have at least one point')

  return (
    <Fragment>
      <AnimatedCircle
        opacity={springs.opacity}
        x={startPoint[0]}
        y={startPoint[1]}
        radius={springs.width.to(v => v + 1)}
        fill={springs.lineColor}
      />
      <AnimatedLine
        opacity={springs.opacity}
        bezier={true}
        points={points.flat()}
        // fill={springs.lineColor}
        stroke={springs.lineColor}
        // strokeWidth={springs.width}
        hitStrokeWidth={25}
        perfectDrawEnabled={false}
        width={springs.width}
        {...listeners}
      />
      {headArrow && (
        <AnimatedLine
          {...listeners}
          opacity={springs.opacity}
          points={headArrow.flat()}
          closed={true}
          fill={springs.lineColor}
          stroke={springs.lineColor}
          strokeWidth={1}
          perfectDrawEnabled={false}
          hitStrokeWidth={0}
        />
      )}
      {labels.map((label, i) => (
        <AnimatedText
          key={i}
          {...listeners}
          x={label.pt[0]}
          y={label.pt[1] - label.fontSize / 2}
          opacity={springs.opacity}
          // padding={2}
          // offsetX={2}
          // offsetY={2}
          // offsetY={label.fontSize / 2}
          // offsetY={label.fontSize / 2}
          // offsetX={label  .width / 2}
          // width={label.width}
          fill={label.color ?? theme.relation.labelColor}
          fontFamily={theme.font}
          fontSize={label.fontSize}
          fontStyle={label.fontStyle ?? 'normal'}
          align={label.align}
          text={label.text}
          perfectDrawEnabled={false}
          // hitStrokeWidth={2}
        />
      ))}
    </Fragment>
  )
}
