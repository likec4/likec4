import type { DiagramEdge } from '@likec4/core'
import clsx from 'clsx'
import { type PointerEventHandler, forwardRef } from 'react'
import type { UndefinedOnPartialDeep } from 'type-fest'
import { useIsReducedGraphics, useLooseReducedGraphics } from '../../../hooks/useReducedGraphics'
import type { EdgeProps } from '../../types'
import * as css from './edge.css'
import { arrowTypeToMarker, EdgeMarkers } from './EdgeMarkers'

type Data = UndefinedOnPartialDeep<
  Pick<
    DiagramEdge,
    | 'line'
    | 'dir'
    | 'tail'
    | 'head'
  >
>

type EdgePathProps = EdgeProps<Data> & {
  svgPath: string
  strokeWidth?: number
  onEdgePointerDown?: PointerEventHandler<SVGGElement> | undefined
}

export const EdgePath = forwardRef<SVGPathElement, EdgePathProps>(({
  id,
  data: {
    line,
    dir,
    tail,
    head,
    ...data
  },
  strokeWidth,
  svgPath,
  style,
  animated = false,
  interactionWidth,
  onEdgePointerDown,
}, svgPathRef) => {
  const isReducedGraphics = useIsReducedGraphics()
  const isLooseReduce = useLooseReducedGraphics()
  let markerStartName = arrowTypeToMarker(tail)
  let markerEndName = arrowTypeToMarker(head ?? 'normal')
  if (dir === 'back') {
    ;[markerStartName, markerEndName] = [markerEndName, markerStartName]
  }

  const MarkerStart = markerStartName ? EdgeMarkers[markerStartName] : null
  const MarkerEnd = markerEndName ? EdgeMarkers[markerEndName] : null

  const isDotted = line === 'dotted'
  const isDashed = isDotted || line === 'dashed'

  let strokeDasharray: string | undefined
  if (isDotted) {
    strokeDasharray = '1,8'
  } else if (isDashed) {
    strokeDasharray = '8,10'
  }
  if (isLooseReduce) {
    strokeDasharray = undefined
  }

  const isAnimated = (animated || data.hovered || data.active) && !data.dimmed
  if (isLooseReduce && isAnimated) {
    style = {
      ...style,
      animationName: 'none',
    }
  }

  return (
    <>
      {!isLooseReduce && (
        <path
          className={clsx('react-flow__edge-interaction')}
          d={svgPath}
          fill="none"
          stroke={'transparent'}
          strokeWidth={interactionWidth ?? 10}
        />
      )}
      <g className={css.markerContext} onPointerDown={onEdgePointerDown}>
        <defs>
          {MarkerStart && <MarkerStart id={'start' + id} />}
          {MarkerEnd && <MarkerEnd id={'end' + id} />}
        </defs>
        {!isReducedGraphics && (
          <path
            className={clsx('react-flow__edge-path', css.edgePathBg)}
            d={svgPath}
            style={style}
            strokeLinecap={'round'}
          />
        )}
        <path
          ref={svgPathRef}
          className={clsx(
            'react-flow__edge-path',
            'react-flow__edge-interaction',
            css.cssEdgePath,
          )}
          d={svgPath}
          style={style}
          strokeWidth={strokeWidth}
          strokeLinecap={'round'}
          strokeDasharray={strokeDasharray}
          markerStart={MarkerStart ? `url(#start${id})` : undefined}
          markerEnd={MarkerEnd ? `url(#end${id})` : undefined}
        />
      </g>
    </>
  )
})
