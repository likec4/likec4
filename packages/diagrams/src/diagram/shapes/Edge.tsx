import type { DiagramEdge } from '@likec4/core/types'
import { animated, useSpring, type SpringValues } from '@react-spring/konva'
import { useCallback, useMemo } from 'react'

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


export const EdgeShape = ({
  edge,
  theme,
  springs,
  onEdgeClick
}: EdgeShapeProps) => {
  const {
    points,
    headArrow,
    label,
    labelBox
  } = edge

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
    onMouseLeave: useCallback(() => opacityApi?.start(0.75), [opacityApi]),
  }
  return <>
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
    {headArrow &&
      <animated.Line
        {...springs}
        {...listeners}
        points={headArrow.flat()}
        closed={true}
        fill={theme.relation.lineColor}
        stroke={theme.relation.lineColor}
        strokeWidth={1}
      />
    }
    {label && labelBox &&
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
        lineHeight={1.12}
        verticalAlign="middle"
      />
    }
  </>
}
