/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/prefer-ts-expect-error */
import type { DiagramEdge } from '@likec4/core/types'
import type { SpringValues } from '@react-spring/konva'
import { AnimatedLine, AnimatedText } from '../../konva'

import type { KonvaNodeEvents } from 'react-konva/es/ReactKonvaCore'
import type { DiagramTheme } from '../types'

export interface EdgeShapeProps extends KonvaNodeEvents {
  edge: DiagramEdge
  theme: DiagramTheme
  springs: SpringValues<{
    opacity: number
  }>
}

export const EdgeShape = ({
  edge,
  theme,
  springs,
  ...listeners
}: EdgeShapeProps) => {
  const { points, headArrow, labels } = edge
  return (
    <>
      {/* @ts-ignore */}
      <AnimatedLine
        {...springs}
        {...listeners}
        points={points.flat()}
        bezier={points.length > 2}
        stroke={theme.relation.lineColor}
        strokeWidth={2}
        hitStrokeWidth={20}
      />
      {headArrow && (
        <AnimatedLine
          {...springs}
          {...listeners}
          points={headArrow.flat()}
          closed={true}
          fill={theme.relation.lineColor}
          stroke={theme.relation.lineColor}
          strokeWidth={1}
        />
      )}
      {labels.map((label, i) =>
        <AnimatedText
          key={i}
          {...springs}
          {...listeners}
          x={label.pt[0]}
          y={label.pt[1] - (label.fontSize / 2)}
          // offsetY={label.fontSize / 2}
          // offsetY={label.fontSize / 2}
          // offsetX={label  .width / 2}
          // width={label.width}
          fill={theme.relation.labelColor}
          fontFamily='Helvetica'
          fontSize={label.fontSize}
          fontStyle={label.fontStyle ?? 'normal'}
          align={label.align}
          text={label.text}
        // wrap='none'
        />
      )}
      {/* {label && labelBox && (
        <AnimatedText
          {...springs}
          {...listeners}
          {...labelBox}
          offsetX={labelBox.align === 'center' ? labelBox.width / 2 : 0}
          text={label}
          padding={0}
          fill={theme.relation.labelColor}
          fontFamily={theme.font}
          fontSize={12}
          lineHeight={1.15}
          verticalAlign='middle'
        />
      )} */}
    </>
  )
}
