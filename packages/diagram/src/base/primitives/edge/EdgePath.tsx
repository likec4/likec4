import type { DiagramEdge } from '@likec4/core/types'
import { css, cx } from '@likec4/styles/css'
import { type PointerEventHandler, forwardRef } from 'react'
import type { UndefinedOnPartialDeep } from 'type-fest'
import type { EdgeProps } from '../../types'
import { cssEdgePath, edgePathBg, hideOnReducedGraphics, markerContext } from './edge.css'
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

type EdgePathProps = {
  edgeProps: EdgeProps<Data>
  svgPath: string
  strokeWidth?: number
  onEdgePointerDown?: PointerEventHandler<SVGGElement> | undefined
}

export const EdgePath = forwardRef<SVGPathElement, EdgePathProps>(({
  edgeProps: {
    id,
    data: {
      line,
      dir,
      tail,
      head,
    },
    style,
    interactionWidth,
  },
  onEdgePointerDown,
  strokeWidth,
  svgPath,
}, svgPathRef) => {
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
    strokeDasharray = '10,8'
  }
  // if (isLooseReduce) {
  //   strokeDasharray = undefined
  // }

  // const isAnimated = (animated || data.hovered || data.active) && !data.dimmed
  // if (isLooseReduce && isAnimated) {
  //   style = {
  //     ...style,
  //     animationName: 'none',
  //   }
  // }

  return (
    <>
      <path
        className={cx(
          'react-flow__edge-interaction',
          hideOnReducedGraphics,
          css({
            fill: '[none]',
          }),
        )}
        d={svgPath}
        strokeWidth={interactionWidth ?? 10}
      />
      <g className={markerContext} onPointerDown={onEdgePointerDown}>
        <defs>
          {MarkerStart && <MarkerStart id={'start' + id} />}
          {MarkerEnd && <MarkerEnd id={'end' + id} />}
        </defs>
        <path
          className={cx('react-flow__edge-path', edgePathBg)}
          d={svgPath}
          style={style}
          strokeLinecap={'round'}
        />
        <path
          ref={svgPathRef}
          className={cx(
            'react-flow__edge-path',
            'react-flow__edge-interaction',
            cssEdgePath,
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
