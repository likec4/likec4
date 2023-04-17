/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/prefer-ts-expect-error */
import type { DiagramEdge } from '@likec4/core/types'
import { animated, type SpringValues } from '@react-spring/konva'
import { useCallback, useMemo } from 'react'
import { Text } from 'react-konva'

import type { DiagramTheme } from '../types'
import type { OnClickEvent } from './types'

export interface EdgeShapeProps {
  edge: DiagramEdge
  theme: DiagramTheme
  springs?: SpringValues<{
    opacity?: number
  }>
  onEdgeClick?: ((edge: DiagramEdge) => void) | undefined
}

export const EdgeShape = ({ edge, theme, springs, onEdgeClick }: EdgeShapeProps) => {
  const { points, headArrow, labels } = edge

  const onClickListener = useMemo(() => {
    if (!onEdgeClick) return {}
    return {
      onClick: (evt: OnClickEvent) => {
        evt.cancelBubble = true
        onEdgeClick(edge)
      }
    }
  }, [edge, onEdgeClick ?? null])

  const opacityApi = springs?.opacity ?? null

  const listeners = {
    ...onClickListener,
    onMouseEnter: useCallback(() => opacityApi?.start(1), [opacityApi]),
    onMouseLeave: useCallback(() => opacityApi?.start(0.75), [opacityApi])
  }
  return (
    <>
    {/* @ts-ignore */}
      <animated.Line
        {...springs}
        {...listeners}
        points={points.flat()}
        bezier={points.length > 2}
        stroke={theme.relation.lineColor}
        strokeWidth={2}
        hitStrokeWidth={20}
      />
      {headArrow && (
        <animated.Line
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
        <animated.Text
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
        <animated.Text
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
