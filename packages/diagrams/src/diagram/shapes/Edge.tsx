/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/prefer-ts-expect-error */
import { Fragment } from 'react'
import type { SpringValues } from '@react-spring/konva'
import { AnimatedLine, AnimatedText } from '../../konva'

import type { KonvaNodeEvents } from 'react-konva/es/ReactKonvaCore'
import type { DiagramTheme, DiagramEdge } from '../types'

export interface EdgeShapeProps extends KonvaNodeEvents {
  edge: DiagramEdge
  theme: DiagramTheme
  springs: SpringValues<{
    width: number
    opacity: number
  }>
}

export function EdgeShape({ edge, theme, springs, ...listeners }: EdgeShapeProps) {
  const { points, headArrow, labels } = edge

  return (
    <Fragment>
      <AnimatedLine
        opacity={springs.opacity}
        bezier={true}
        points={points.flat()}
        fill={theme.relation.lineColor}
        stroke={theme.relation.lineColor}
        strokeWidth={springs.width}
        hitStrokeWidth={20}
        perfectDrawEnabled={false}
      />
      {headArrow && (
        <AnimatedLine
          {...listeners}
          opacity={springs.opacity}
          points={headArrow.flat()}
          closed={true}
          fill={theme.relation.lineColor}
          stroke={theme.relation.lineColor}
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
          hitStrokeWidth={0}
        />
      ))}
    </Fragment>
  )
}
