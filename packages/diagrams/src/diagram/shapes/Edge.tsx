import type { DiagramEdge } from '@likec4/core/types'
import { isEqualReactSimple as deepEqual } from '@react-hookz/deep-equal/esm'
import { animated, useSpring } from '@react-spring/konva'
import { memo, useCallback, useMemo } from 'react'

import type { DiagramTheme } from '../types'
import type { OnClickEvent } from './types'

export interface EdgeShapeProps {
  edge: DiagramEdge
  theme: DiagramTheme
  onEdgeClick?: ((edge: DiagramEdge) => void) | undefined
}

export const EdgeShape = memo(({
  edge,
  theme,
  onEdgeClick
}: EdgeShapeProps) => {
  const {
    points,
    // headPolygon,
    label
  } = edge

  const [opacity, opacityApi] = useSpring(
    () => ({
      opacity: 0.8
    }),
    []
  )

  const onClickListener = useMemo(() => {
    if (!onEdgeClick) return {}
    return {
      onClick: (evt: OnClickEvent) => {
        evt.cancelBubble = true
        onEdgeClick(edge)
      }
    }
  }, [edge, onEdgeClick ?? null])

  const listeners = {
    ...onClickListener,
    onMouseEnter: useCallback(() => opacityApi.start({ opacity: 1 }), [opacityApi]),
    onMouseLeave: useCallback(() => opacityApi.start({ opacity: 0.8 }), [opacityApi]),
  }

  return <>
    {/* eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error, @typescript-eslint/ban-ts-comment */}
    {/* @ts-ignore */}
    <animated.Line
      {...opacity}
      {...listeners}
      points={points.flat()}
      bezier={points.length > 2}
      stroke={theme.relation.lineColor}
      strokeWidth={2}
      hitStrokeWidth={20}
    />
    {/* {headPolygon &&
      <animated.Line
        {...opacity}
        {...listeners}
        points={headPolygon.flat()}
        closed={true}
        fill={theme.relation.lineColor}
        stroke={theme.relation.lineColor}
        strokeWidth={1}
      />
    } */}
    {/* {label &&
      <animated.Text
        {...opacity}
        {...listeners}
        {...label}
        padding={0}
        fill={theme.relation.labelColor}
        fontFamily={theme.font}
        fontSize={12}
        lineHeight={1.12}
      />
    } */}
  </>
}, deepEqual)
