import type { EdgeId } from '@likec4/core/types'
import { cx as clsx } from '@likec4/styles/css'
import { useRafEffect } from '@react-hookz/web'
import type { XYPosition } from '@xyflow/react'
import { EdgeLabelRenderer } from '@xyflow/react'
import { type PointerEvent as ReactPointerEvent, useRef, useState } from 'react'
import {
  EdgeActionButton,
  EdgeContainer,
  EdgeLabel,
  EdgeLabelContainer,
  EdgePath,
  memoEdge,
} from '../../../base-primitives'
import { ZIndexes } from '../../../base/const'
import { useEnabledFeatures } from '../../../context/DiagramFeatures'
import { useCallbackRef } from '../../../hooks/useCallbackRef'
import { useDiagram } from '../../../hooks/useDiagram'
import { useUpdateEffect } from '../../../hooks/useUpdateEffect'
import { useXYFlow, useXYStoreApi } from '../../../hooks/useXYFlow'
import {
  isSamePoint,
} from '../../../utils/xyflow'
import type { Types } from '../../types'
import * as edgesCss from './edges.css'
import { useControlPoints } from './useControlPoints'
import { useRelationshipEdgePath } from './useRelationshipEdgePath'

const getEdgeCenter = (path: SVGPathElement) => {
  const dompoint = path.getPointAtLength(path.getTotalLength() * 0.5)
  return {
    x: Math.round(dompoint.x),
    y: Math.round(dompoint.y),
  }
}

export const RelationshipEdge = memoEdge<Types.EdgeProps<'relationship'>>((props) => {
  const [isControlPointDragging, setIsControlPointDragging] = useState(false)
  const xyflow = useXYFlow()
  const diagram = useDiagram()
  const {
    enableNavigateTo,
    enableReadOnly,
  } = useEnabledFeatures()
  const enabledEditing = !enableReadOnly
  const {
    id,
    selected = false,
    data: {
      hovered = false,
      active = false,
      labelBBox,
      labelXY,
      ...data
    },
  } = props

  const navigateTo = enableNavigateTo ? data.navigateTo : undefined

  const {
    controlPoints,
    setControlPoints,
    insertControlPoint,
  } = useControlPoints(props)

  let edgePath = useRelationshipEdgePath({
    props,
    controlPoints,
    isControlPointDragging,
  })

  let labelX = labelBBox?.x ?? 0,
    labelY = labelBBox?.y ?? 0

  const [labelPos, setLabelPos] = useState<XYPosition>({
    x: labelXY?.x ?? labelX,
    y: labelXY?.y ?? labelY,
  })

  useUpdateEffect(() => {
    setLabelPos({
      x: labelX,
      y: labelY,
    })
  }, [labelX, labelY])

  const svgPathRef = useRef<SVGPathElement>(null)

  useRafEffect(() => {
    const path = svgPathRef.current
    if (!path || !isControlPointDragging) return
    setLabelPos(getEdgeCenter(path))
  }, [edgePath, isControlPointDragging])

  if (isControlPointDragging) {
    labelX = labelPos.x
    labelY = labelPos.y
  }

  const updateEdgeData = useCallbackRef((controlPoints: XYPosition[]) => {
    const point = svgPathRef.current ? getEdgeCenter(svgPathRef.current) : null
    if (labelBBox && point) {
      diagram.updateEdgeData(id as EdgeId, {
        controlPoints,
        labelBBox: {
          ...labelBBox,
          ...point,
        },
        labelXY: point,
      })
    } else {
      diagram.updateEdgeData(id as EdgeId, { controlPoints })
    }
    diagram.stopEditing(true)
    setIsControlPointDragging(false)
  })

  const onControlPointerStartMove = useCallbackRef(() => {
    diagram.startEditing('edge')
    diagram.send({ type: 'xyflow.edgeEditingStarted', edge: props.data })
    setIsControlPointDragging(true)
  })
  const onControlPointerCancelMove = useCallbackRef(() => {
    diagram.stopEditing()
    setIsControlPointDragging(false)
  })

  const onControlPointerFinishMove = useCallbackRef((points: XYPosition[]) => {
    setControlPoints(points)
    requestAnimationFrame(() => {
      updateEdgeData(points)
    })
  })
  const onControlPointerDelete = useCallbackRef((points: XYPosition[]) => {
    diagram.startEditing('edge')
    setIsControlPointDragging(true)
    setControlPoints(points)
    requestAnimationFrame(() => {
      updateEdgeData(points)
    })
  })

  /**
   * Handle pointer down event on the edge to add new control points
   */
  const onEdgePointerDown = useCallbackRef((e: ReactPointerEvent<SVGElement>) => {
    if (e.pointerType !== 'mouse') {
      return
    }
    if (e.button !== 2) {
      return
    }
    e.stopPropagation()
    e.preventDefault()

    diagram.startEditing('edge')
    const newControlPoints = insertControlPoint(
      xyflow.screenToFlowPosition(
        {
          x: e.clientX,
          y: e.clientY,
        },
        { snapToGrid: false },
      ),
    )
    diagram.updateEdgeData(id as EdgeId, { controlPoints: newControlPoints })
    diagram.stopEditing(true)
  })

  // Force hovered state when dragging control point
  if (isControlPointDragging && !props.data.hovered) {
    props = {
      ...props,
      data: {
        ...props.data,
        hovered: true,
      },
    }
  }

  return (
    <>
      <EdgeContainer {...props} className={clsx(isControlPointDragging && edgesCss.controlDragging)}>
        <EdgePath
          edgeProps={props}
          svgPath={edgePath}
          ref={svgPathRef}
          isDragging={isControlPointDragging}
          {...enabledEditing && {
            onEdgePointerDown,
          }} />
        {labelBBox && (
          <EdgeLabelContainer
            edgeProps={props}
            labelPosition={{ x: labelX, y: labelY }}
          >
            <EdgeLabel
              pointerEvents={enabledEditing ? 'none' : 'all'}
              edgeProps={props}>
              {!enabledEditing && navigateTo && (
                <EdgeActionButton
                  onClick={e => {
                    e.stopPropagation()
                    diagram.navigateTo(navigateTo)
                  }} />
              )}
            </EdgeLabel>
          </EdgeLabelContainer>
        )}
      </EdgeContainer>
      {/* Render control points above edge label  */}
      {enabledEditing && controlPoints.length > 0 && (selected || active || hovered || isControlPointDragging) && (
        <ControlPoints
          edgeProps={props}
          controlPoints={controlPoints}
          onMove={setControlPoints}
          onStartMove={onControlPointerStartMove}
          onCancelMove={onControlPointerCancelMove}
          onFinishMove={onControlPointerFinishMove}
          onDelete={onControlPointerDelete}
          zIndex={ZIndexes.Element + 500}
        />
      )}
    </>
  )
})
RelationshipEdge.displayName = 'RelationshipEdge'

function ControlPoints({
  edgeProps,
  controlPoints,
  onMove,
  onStartMove,
  onCancelMove,
  onFinishMove,
  onDelete,
  zIndex,
}: {
  edgeProps: Types.EdgeProps<'relationship'>
  controlPoints: XYPosition[]
  onMove: (points: XYPosition[]) => void
  onStartMove: () => void
  onCancelMove: () => void
  onFinishMove: (points: XYPosition[]) => void
  onDelete: (points: XYPosition[]) => void
  zIndex: number
}) {
  const xyflowStore = useXYStoreApi()
  const xyflow = useXYFlow()
  const edgeId = edgeProps.data.id

  const onLmbControlPointerDown = (index: number, e: ReactPointerEvent<SVGCircleElement>, domNode: HTMLDivElement) => {
    let hasMoved = false
    let pointer = { x: e.clientX, y: e.clientY }

    let animationFrameId: number | null = null

    let cp = controlPoints

    const onPointerMove = (e: PointerEvent) => {
      const clientPoint = {
        x: e.clientX,
        y: e.clientY,
      }
      if (!isSamePoint(pointer, clientPoint)) {
        if (!hasMoved) {
          hasMoved = true
          onStartMove()
        }
        pointer = clientPoint
        animationFrameId ??= requestAnimationFrame(() => {
          animationFrameId = null
          cp = cp.slice()
          const { x, y } = xyflow.screenToFlowPosition(pointer, { snapToGrid: false })
          cp[index] = {
            x: Math.round(x),
            y: Math.round(y),
          }
          onMove(cp)
        })
      }
      e.stopPropagation()
    }

    const onPointerUp = (e: PointerEvent) => {
      e.stopPropagation()
      domNode.removeEventListener('pointermove', onPointerMove, {
        capture: true,
      })
      domNode.removeEventListener('click', stopAndPrevent, {
        capture: true,
      })
      if (hasMoved) {
        onFinishMove(cp)
      } else {
        onCancelMove()
      }
    }

    domNode.addEventListener('pointermove', onPointerMove, {
      capture: true,
    })
    domNode.addEventListener('pointerup', onPointerUp, {
      once: true,
      capture: true,
    })
    // Handle click to prevent it from being handled by the edge #1945
    domNode.addEventListener('click', stopAndPrevent, {
      capture: true,
      once: true,
    })
  }

  const onRmbControlPointerDown = (index: number, e: ReactPointerEvent<SVGCircleElement>) => {
    if (controlPoints.length <= 1) {
      return
    }
    e.stopPropagation()
    e.preventDefault()

    const newControlPoints = controlPoints.slice()
    newControlPoints.splice(index, 1)
    // Defer the update to avoid conflict with the pointerup event
    setTimeout(() => {
      onDelete(newControlPoints)
    }, 10)
  }

  const onControlPointerDown = useCallbackRef((e: ReactPointerEvent<SVGCircleElement>) => {
    const { domNode, addSelectedEdges } = xyflowStore.getState()
    if (!domNode || e.pointerType !== 'mouse') {
      return
    }
    const index = parseFloat(e.currentTarget.getAttribute('data-control-point-index') || '')
    if (isNaN(index)) {
      throw new Error('data-control-point-index is not a number')
    }

    switch (e.button) {
      case 0: {
        e.stopPropagation()
        addSelectedEdges([edgeId])
        onLmbControlPointerDown(index, e, domNode)
        break
      }
      case 2:
        onRmbControlPointerDown(index, e)
        break
    }
  })

  return (
    <EdgeLabelRenderer>
      <EdgeContainer
        component="svg"
        className={edgesCss.controlPointsContainer}
        {...edgeProps}
        style={{
          ...edgeProps.style,
          zIndex,
        }}
      >
        <g
          onContextMenu={stopAndPrevent}>
          {controlPoints.map((p, i) => (
            <circle
              data-control-point-index={i}
              onPointerDownCapture={onControlPointerDown}
              className={clsx('nodrag nopan', edgesCss.controlPoint)}
              key={'controlPoints' + edgeId + '#' + i}
              cx={p.x}
              cy={p.y}
              r={3}
            />
          ))}
        </g>
      </EdgeContainer>
    </EdgeLabelRenderer>
  )
}

const stopAndPrevent = (e: React.MouseEvent | MouseEvent) => {
  e.stopPropagation()
  e.preventDefault()
}
