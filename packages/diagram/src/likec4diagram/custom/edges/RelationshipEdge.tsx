import {
  type EdgeId,
  nonNullable,
} from '@likec4/core'
import { cx as clsx } from '@likec4/styles/css'
import { useCallbackRef } from '@mantine/hooks'
import { useDebouncedEffect, useRafEffect } from '@react-hookz/web'
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
import { useXYFlow, useXYInternalNode, useXYStoreApi } from '../../../hooks/useXYFlow'
import { roundDpr } from '../../../utils/roundDpr'
import { vector, VectorImpl } from '../../../utils/vector'
import { bezierControlPoints, bezierPath, isSamePoint } from '../../../utils/xyflow'
import type { Types } from '../../types'
import * as edgesCss from './edges.css'
import { getNodeIntersectionFromCenterToPoint } from './utils'

const curve = d3line<XYPosition>()
  .curve(curveCatmullRomOpen)
  .x(d => roundDpr(d.x))
  .y(d => roundDpr(d.y))

export const RelationshipEdge = memoEdge<Types.EdgeProps<'relationship'>>((props) => {
  const [isControlPointDragging, setIsControlPointDragging] = useState(false)
  const xyflowStore = useXYStoreApi()
  const xyflow = useXYFlow()
  const diagram = useDiagram()
  const {
    enableNavigateTo,
    enableReadOnly,
  } = useEnabledFeatures()
  const enableEdgeEditing = !enableReadOnly
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
      id: edgeId,
      points,
      hovered = false,
      active = false,
      labelBBox,
      labelXY,
      ...data
    },
    style = {},
  } = props

  const navigateTo = enableNavigateTo ? data.navigateTo : undefined

  // const sourceNode = nonNullable(useXYInternalNode(source)!, `source node ${source} not found`)
  // const targetNode = nonNullable(useXYInternalNode(target)!, `target node ${target} not found`)

  const isModified = false
  // const isModified = isTruthy(data.controlPoints)
  //   || !isSamePoint(sourceNode.internals.positionAbsolute, sourceNode.data)
  //   || !isSamePoint(targetNode.internals.positionAbsolute, targetNode.data)

  let controlPoints = data.controlPoints ?? bezierControlPoints(props.data)

  let edgePath: string = ''

  if (isModified) {
    // const sourceCenterPos = { x: sourceX, y: sourceY }
    // const targetCenterPos = { x: targetX, y: targetY }

    // const nodeMargin = 6
    // const points = data.dir === 'back'
    //   ? [
    //     targetCenterPos,
    //     getNodeIntersectionFromCenterToPoint(targetNode, first(controlPoints) ?? sourceCenterPos, nodeMargin),
    //     ...controlPoints,
    //     getNodeIntersectionFromCenterToPoint(sourceNode, last(controlPoints) ?? targetCenterPos, nodeMargin),
    //     sourceCenterPos,
    //   ]
    //   : [
    //     sourceCenterPos,
    //     getNodeIntersectionFromCenterToPoint(sourceNode, first(controlPoints) ?? targetCenterPos, nodeMargin),
    //     ...controlPoints,
    //     getNodeIntersectionFromCenterToPoint(targetNode, last(controlPoints) ?? sourceCenterPos, nodeMargin),
    //     targetCenterPos,
    //   ]

    // edgePath = nonNullable(curve(points))
  } else {
    edgePath = bezierPath(points)
  }

  let labelX = labelBBox?.x ?? 0,
    labelY = labelBBox?.y ?? 0

  const [labelPos, setLabelPos] = useState<XYPosition>({
    x: labelXY?.x ?? labelX,
    y: labelXY?.y ?? labelY,
  })

  const svgPathRef = useRef<SVGPathElement>(null)
  useRafEffect(() => {
    const path = svgPathRef.current
    if (!path) return
    const dompoint = path.getPointAtLength(path.getTotalLength() * 0.5)
    const point = {
      x: roundDpr(dompoint.x),
      y: roundDpr(dompoint.y),
    }
    setLabelPos(current => isSamePoint(current, point) ? current : point)
  }, [edgePath])

  useDebouncedEffect(
    () => {
      if (!labelBBox || labelBBox.x === labelPos.x && labelBBox.y === labelPos.y) {
        return
      }
      // This update stays only in internal xystate, not in diagram xstate
      diagram.updateEdgeData(id as EdgeId, {
        labelXY: {
          x: labelPos.x,
          y: labelPos.y,
        },
      })
    },
    [labelPos],
    50,
    300,
  )

  if (isModified || isControlPointDragging) {
    labelX = labelPos.x
    labelY = labelPos.y
  }

  const onLmbControlPointerDown = (index: number, e: ReactPointerEvent<SVGCircleElement>, domNode: HTMLDivElement) => {
    const { addSelectedEdges } = xyflowStore.getState()

    addSelectedEdges([id])

    const wasCanceled = diagram.cancelSaveManualLayout()
    e.stopPropagation()
    let hasMoved = false
    let pointer = { x: e.clientX, y: e.clientY }

    let animationFrameId: number | null = null

    const onPointerMove = (e: PointerEvent) => {
      const clientPoint = {
        x: e.clientX,
        y: e.clientY,
      }
      if (!isSamePoint(pointer, clientPoint)) {
        setIsControlPointDragging(true)
        if (!hasMoved) {
          diagram.send({ type: 'xyflow.edgeEditingStarted', edge: props.data })
          hasMoved = true
        }
        pointer = clientPoint
        const { x, y } = xyflow.screenToFlowPosition(pointer, { snapToGrid: false })
        const cp = controlPoints.slice()
        cp[index] = {
          x: Math.round(x),
          y: Math.round(y),
        }
        if (animationFrameId != null) {
          cancelAnimationFrame(animationFrameId)
        }
        animationFrameId = requestAnimationFrame(() => {
          animationFrameId = null
          diagram.updateEdgeData(id as EdgeId, {
            controlPoints: cp,
          })
        })
      }
      e.stopPropagation()
    }

    const onPointerUp = (e: PointerEvent) => {
      domNode.removeEventListener('pointermove', onPointerMove, {
        capture: true,
      })
      if (hasMoved) {
        e.stopPropagation()
      }
      if (hasMoved || wasCanceled) {
        diagram.scheduleSaveManualLayout()
      }
      setIsControlPointDragging(false)
    }

    const onClick = (e: MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()
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

    const onPointerUp = (e: PointerEvent) => {
      const newControlPoints = controlPoints.slice()
      newControlPoints.splice(index, 1)
      e.stopPropagation()
      // Defer the update to avoid conflict with the pointerup event
      setTimeout(() => {
        diagram.updateEdgeData(id as EdgeId, { controlPoints: newControlPoints })
        diagram.scheduleSaveManualLayout()
      }, 10)
    }

    domNode.addEventListener('pointerup', onPointerUp, {
      once: true,
      capture: true,
    })

    e.stopPropagation()
  }

  const onControlPointerDown = useCallbackRef((e: ReactPointerEvent<SVGCircleElement>) => {
    const { domNode } = xyflowStore.getState()
    if (!domNode || e.pointerType !== 'mouse') {
      return
    }
    const index = Number(e.currentTarget.getAttribute('data-control-point-index'))
    if (isNaN(index)) {
      throw new Error('data-control-point-index is not a number')
    }

    switch (e.button) {
      case 0:
        onLmbControlPointerDown(index, e, domNode)
        break
      case 2:
        onRmbControlPointerDown(index, e, domNode)
        break
    }
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
    const points: VectorImpl[] = [
      new VectorImpl(sourceX, sourceY),
      ...controlPoints.map(vector) || [],
      new VectorImpl(targetX, targetY),
    ]

    let pointer = { x: e.clientX, y: e.clientY }
    const newPoint = vector(xyflow.screenToFlowPosition(pointer, { snapToGrid: false }))

    let insertionIndex = 0
    let minDistance = Infinity
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i]!,
        b = points[i + 1]!,
        fromCurrentToNext = b.sub(a),
        fromCurrentToNew = newPoint.sub(a),
        fromNextToNew = newPoint.sub(b)

      // Is pointer above the current segment?
      if (fromCurrentToNext.dot(fromCurrentToNew) * fromCurrentToNext.dot(fromNextToNew) < 0) {
        // Calculate distance by approximating edge segment with a staight line
        const distanceToEdge = Math.abs(fromCurrentToNext.cross(fromCurrentToNew).abs() / fromCurrentToNext.abs())

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
          {...enableEdgeEditing && {
            onEdgePointerDown,
          }} />
        <EdgeLabelContainer
          edgeProps={props}
          labelPosition={{
            x: labelX,
            y: labelY,
            translate: isModified ? 'translate(-50%, 0)' : undefined,
          }}
        >
          <EdgeLabel
            pointerEvents={enableEdgeEditing ? 'none' : 'all'}
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
      </EdgeContainer>
      {/* Render control points above edge label  */}
      {enableEdgeEditing && controlPoints.length > 0 && (selected || hovered || isControlPointDragging) && (
        <EdgeLabelRenderer>
          <EdgeContainer
            component="svg"
            className={edgesCss.controlPointsContainer}
            {...props}
            style={{
              ...style,
              zIndex,
            }}
          >
            <g
              onContextMenu={e => {
                e.preventDefault()
                e.stopPropagation()
              }}>
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
      )}
    </>
  )
})
