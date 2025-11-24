import type { DiagramEdge } from '@likec4/core/types'
import { css, cx } from '@likec4/styles/css'
import { type PointerEventHandler, forwardRef } from 'react'
import type { UndefinedOnPartialDeep } from 'type-fest'
import type { BaseEdgePropsWithData } from '../../base/types'
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
  edgeProps: BaseEdgePropsWithData<Data>
  svgPath: string
  /**
   * If true, the edge is being dragged (used to disable animations)
   */
  isDragging?: boolean
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
    selectable = true,
    style,
    interactionWidth,
  },
  isDragging = false, // omit
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
    strokeDasharray = '8,10'
  }

  return (
    <>
      {selectable && (
        <path
          className={cx(
            'react-flow__edge-interaction',
            css({
              fill: 'none',
            }),
          )}
          onPointerDown={onEdgePointerDown}
          d={svgPath}
          style={{
            strokeWidth: interactionWidth ?? 10,
            stroke: 'currentcolor',
            strokeOpacity: 0,
            ...isDragging ? { display: 'none' } : {},
          }}
        />
      )}
      <circle
        // Defined in recipe
        className={'likec4-edge-middle-point'}
        style={{
          offsetPath: `path("${svgPath}")`,
        }} />

      <g className={'likec4-edge-markers'} onPointerDown={onEdgePointerDown}>
        <defs>
          {MarkerStart && <MarkerStart id={'start' + id} />}
          {MarkerEnd && <MarkerEnd id={'end' + id} />}
        </defs>
        <path
          key={'edge-path-bg'}
          className={cx(
            'react-flow__edge-path',
            'hide-on-reduced-graphics',
            'likec4-edge-path-bg',
            isDragging && css({ display: 'none' }),
          )}
          d={svgPath}
          style={style}
          strokeLinecap={'round'}
        />
        <path
          key={'edge-path'}
          ref={svgPathRef}
          className={cx(
            'react-flow__edge-path',
            'likec4-edge-path',
            selectable && 'react-flow__edge-interaction',
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
EdgePath.displayName = 'EdgePath'
