import {
  type EdgeId,
  nonNullable,
} from '@likec4/core'
import { cx as clsx } from '@likec4/styles/css'
import { useCallbackRef } from '@mantine/hooks'
import { useRafEffect } from '@react-hookz/web'
import type { XYPosition } from '@xyflow/react'
import { EdgeLabelRenderer } from '@xyflow/react'
import { curveCatmullRomOpen, line as d3line } from 'd3-shape'
import { type PointerEvent as ReactPointerEvent, useRef, useState } from 'react'
import { first, isTruthy, last } from 'remeda'
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
import { useDiagram } from '../../../hooks/useDiagram'
import { useUpdateEffect } from '../../../hooks/useUpdateEffect'
import { useXYFlow, useXYInternalNode, useXYStoreApi } from '../../../hooks/useXYFlow'
import { roundDpr } from '../../../utils/roundDpr'
import { Vector, vector } from '../../../utils/vector'
import {
  bezierControlPoints,
  bezierPath,
  getNodeIntersectionFromCenterToPoint,
  isSamePoint,
} from '../../../utils/xyflow'
import type { Types } from '../../types'
import * as edgesCss from './edges.css'

const curve = d3line<XYPosition>()
  .curve(curveCatmullRomOpen.alpha(0.7))
  .x(d => roundDpr(d.x))
  .y(d => roundDpr(d.y))

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
    source,
    sourceX,
    sourceY,
    target,
    targetX,
    targetY,
    selected = false,
    data: {
      points,
      hovered = false,
      active = false,
      labelBBox,
      labelXY,
      ...data
    },
  } = props

  const navigateTo = enableNavigateTo ? data.navigateTo : undefined

  const sourceNode = nonNullable(useXYInternalNode(source)!, `source node ${source} not found`)
  const targetNode = nonNullable(useXYInternalNode(target)!, `target node ${target} not found`)

  const isModified = isTruthy(data.controlPoints) || isControlPointDragging

  let [controlPoints, setControlPoints] = useState<XYPosition[]>(() =>
    data.controlPoints ?? bezierControlPoints(props.data.points)
  )
  useUpdateEffect(() => {
    setControlPoints(data.controlPoints ?? bezierControlPoints(props.data.points))
  }, [
    data.controlPoints?.map(p => `${p.x},${p.y}`).join('|') ?? '',
    props.data.points.map(p => `${p[0]},${p[1]}`).join('|'),
  ])

  let edgePath: string = ''

  if (isModified && controlPoints) {
    const sourceCenterPos = { x: sourceX, y: sourceY }
    const targetCenterPos = { x: targetX, y: targetY }

    const nodeMargin = 6
    const points = data.dir === 'back'
      ? [
        targetCenterPos,
        getNodeIntersectionFromCenterToPoint(targetNode, first(controlPoints) ?? sourceCenterPos, nodeMargin),
        ...controlPoints,
        getNodeIntersectionFromCenterToPoint(sourceNode, last(controlPoints) ?? targetCenterPos, nodeMargin),
        sourceCenterPos,
      ]
      : [
        sourceCenterPos,
        getNodeIntersectionFromCenterToPoint(sourceNode, first(controlPoints) ?? targetCenterPos, nodeMargin),
        ...controlPoints,
        getNodeIntersectionFromCenterToPoint(targetNode, last(controlPoints) ?? sourceCenterPos, nodeMargin),
        targetCenterPos,
      ]

    edgePath = nonNullable(curve(points))
  } else {
    edgePath = bezierPath(points)
  }

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

  const wasDiagramSyncCancelledRef = useRef(false)

  const onControlPointerStartMove = useCallbackRef(() => {
    wasDiagramSyncCancelledRef.current = diagram.cancelSaveManualLayout()
    setIsControlPointDragging(true)
    diagram.send({ type: 'xyflow.edgeEditingStarted', edge: props.data })
  })
  const onControlPointerCancelMove = useCallbackRef(() => {
    if (wasDiagramSyncCancelledRef.current) {
      diagram.scheduleSaveManualLayout()
    }
    wasDiagramSyncCancelledRef.current = false
    setIsControlPointDragging(false)
  })

  const onControlPointerFinishMove = useCallbackRef((points: XYPosition[]) => {
    setControlPoints(points)
    const point = svgPathRef.current ? getEdgeCenter(svgPathRef.current) : null
    diagram.updateEdgeData(id as EdgeId, {
      controlPoints: points,
      ...(labelBBox && point && {
        labelBBox: {
          ...labelBBox,
          ...point,
        },
        labelXY: point,
      }),
    })
    diagram.scheduleSaveManualLayout()
    setIsControlPointDragging(false)
  })
  const onControlPointerDelete = useCallbackRef((points: XYPosition[]) => {
    setControlPoints(points)
    diagram.updateEdgeData(id as EdgeId, { controlPoints: points })
    diagram.scheduleSaveManualLayout()
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
    const points: Vector[] = [
      new Vector(sourceX, sourceY),
      ...controlPoints.map(vector) || [],
      new Vector(targetX, targetY),
    ]

    let pointer = { x: e.clientX, y: e.clientY }
    const newPoint = vector(xyflow.screenToFlowPosition(pointer, { snapToGrid: false }))

    let insertionIndex = 0
    let minDistance = Infinity
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i]!,
        b = points[i + 1]!,
        fromCurrentToNext = b.subtract(a),
        fromCurrentToNew = newPoint.subtract(a),
        fromNextToNew = newPoint.subtract(b)

      // Is pointer above the current segment?
      if (fromCurrentToNext.dot(fromCurrentToNew) * fromCurrentToNext.dot(fromNextToNew) < 0) {
        // Calculate distance by approximating edge segment with a staight line
        const distanceToEdge = Math.abs(fromCurrentToNext.cross(fromCurrentToNew).length() / fromCurrentToNext.length())

        if (distanceToEdge < minDistance) {
          minDistance = distanceToEdge
          insertionIndex = i
        }
      }
    }

    const newControlPoints = controlPoints.slice() || []
    newControlPoints.splice(insertionIndex, 0, newPoint)

    diagram.updateEdgeData(id as EdgeId, { controlPoints: newControlPoints })

    diagram.scheduleSaveManualLayout()

    e.stopPropagation()
    e.preventDefault()
  })

  let zIndex = ZIndexes.Edge
  if (hovered || active || isControlPointDragging) {
    // Move above the elements
    zIndex = ZIndexes.Element + 50
  }

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
              {navigateTo && (
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
      {enabledEditing && controlPoints.length > 0 && (selected || hovered || isControlPointDragging) && (
        <ControlPoints
          edgeProps={props}
          controlPoints={controlPoints}
          onMove={setControlPoints}
          onStartMove={onControlPointerStartMove}
          onCancelMove={onControlPointerCancelMove}
          onFinishMove={onControlPointerFinishMove}
          onDelete={onControlPointerDelete}
          zIndex={zIndex}
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

    let cp = controlPoints.slice()

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

    const onClick = (e: MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()
    }

    const onPointerUp = (e: PointerEvent) => {
      e.stopPropagation()
      domNode.removeEventListener('pointermove', onPointerMove, {
        capture: true,
      })
      domNode.removeEventListener('click', onClick, {
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
    domNode.addEventListener('click', onClick, {
      capture: true,
      once: true,
    })
  }

  const onRmbControlPointerDown = (index: number, e: ReactPointerEvent<SVGCircleElement>, domNode: HTMLDivElement) => {
    if (controlPoints.length <= 1) {
      return
    }
    e.stopPropagation()

    const onPointerUp = (e: PointerEvent) => {
      e.stopPropagation()
      // Defer the update to avoid conflict with the pointerup event
      setTimeout(() => {
        const newControlPoints = controlPoints.slice()
        newControlPoints.splice(index, 1)
        onDelete(newControlPoints)
      }, 10)
    }

    domNode.addEventListener('pointerup', onPointerUp, {
      once: true,
      capture: true,
    })
  }

  const onControlPointerDown = useCallbackRef((e: ReactPointerEvent<SVGCircleElement>) => {
    const { domNode, addSelectedEdges } = xyflowStore.getState()
    if (!domNode || e.pointerType !== 'mouse') {
      return
    }
    const index = Number(e.currentTarget.getAttribute('data-control-point-index'))
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
        onRmbControlPointerDown(index, e, domNode)
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
              onPointerDown={onControlPointerDown}
              className={clsx('nodrag nopan', edgesCss.controlPoint)}
              key={'controlPoints' + edgeId + '#' + i}
              cx={Math.round(p.x)}
              cy={Math.round(p.y)}
              r={3}
            />
          ))}
        </g>
      </EdgeContainer>
    </EdgeLabelRenderer>
  )
}

const stopAndPrevent = (e: React.MouseEvent) => {
  e.stopPropagation()
  e.preventDefault()
}
