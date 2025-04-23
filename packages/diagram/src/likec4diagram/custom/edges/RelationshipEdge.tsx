import {
  type EdgeId,
  nonNullable,
} from '@likec4/core'
import { useDebouncedEffect } from '@react-hookz/web'
import type { XYPosition } from '@xyflow/react'
import { EdgeLabelRenderer } from '@xyflow/react'
import clsx from 'clsx'
import { curveCatmullRomOpen, line as d3line } from 'd3-shape'
import { type PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from 'react'
import { first, isTruthy, last } from 'remeda'
import { ZIndexes } from '../../../base/const'
import {
  customEdge,
  EdgeActionButton,
  EdgeContainer,
  EdgeLabel,
  EdgeLabelContainer,
  EdgePath,
} from '../../../base/primitives'
import { useEnabledFeatures } from '../../../context/DiagramFeatures'
import { useDiagram, useDiagramActorSnapshot } from '../../../hooks/useDiagram'
import { useIsPanning } from '../../../hooks/useReducedGraphics'
import { useXYFlow, useXYInternalNode, useXYStoreApi } from '../../../hooks/useXYFlow'
import type { DiagramActorSnapshot } from '../../../state/types'
import { vector, VectorImpl } from '../../../utils/vector'
import { bezierControlPoints, bezierPath, isSamePoint } from '../../../utils/xyflow'
import type { Types } from '../../types'
import * as edgesCss from './edges.css'
import { NotePopover } from './NotePopover'
import { RelationshipsDropdownMenu } from './RelationshipsDropdownMenu'
import { getNodeIntersectionFromCenterToPoint } from './utils'

const curve = d3line<XYPosition>()
  .curve(curveCatmullRomOpen)
  .x(d => d.x)
  .y(d => d.y)

const selectActiveStepId = (s: DiagramActorSnapshot) => s.context.activeWalkthrough?.stepId ?? null
export const RelationshipEdge = customEdge<Types.RelationshipEdgeData>((props) => {
  const isPanning = useIsPanning()
  const [isControlPointDragging, setIsControlPointDragging] = useState(false)
  const xyflowStore = useXYStoreApi()
  const xyflow = useXYFlow()
  const diagram = useDiagram()
  const activeWalkthroughStep = useDiagramActorSnapshot(selectActiveStepId)
  const { enableNavigateTo, enableEdgeEditing, enableRelationshipDetails } = useEnabledFeatures()
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
      dimmed = false,
      labelBBox,
      labelXY,
      ...data
    },
    style = {},
  } = props

  const navigateTo = enableNavigateTo ? data.navigateTo : undefined

  const sourceNode = nonNullable(useXYInternalNode(source)!, `source node ${source} not found`)
  const targetNode = nonNullable(useXYInternalNode(target)!, `target node ${target} not found`)

  const isModified = isTruthy(data.controlPoints)
    || !isSamePoint(sourceNode.internals.positionAbsolute, sourceNode.data.position)
    || !isSamePoint(targetNode.internals.positionAbsolute, targetNode.data.position)

  let controlPoints = data.controlPoints ?? bezierControlPoints(props.data)

  let edgePath: string

  if (isModified) {
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

  const svgPathRef = useRef<SVGPathElement>(null)
  useEffect(() => {
    const path = svgPathRef.current
    if (!path) return
    const dompoint = path.getPointAtLength(path.getTotalLength() * 0.5)
    const point = {
      x: Math.round(dompoint.x),
      y: Math.round(dompoint.y),
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

    const onPointerMove = (e: PointerEvent) => {
      const clientPoint = {
        x: e.clientX,
        y: e.clientY,
      }
      if (!isSamePoint(pointer, clientPoint)) {
        setIsControlPointDragging(true)
        hasMoved = true
        pointer = clientPoint
        const { x, y } = xyflow.screenToFlowPosition(pointer, { snapToGrid: false })
        const cp = controlPoints.slice()
        cp[index] = {
          x: Math.round(x),
          y: Math.round(y),
        }
        diagram.updateEdgeData(id as EdgeId, {
          controlPoints: cp,
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

    domNode.addEventListener('pointermove', onPointerMove, {
      capture: true,
    })
    domNode.addEventListener('pointerup', onPointerUp, {
      once: true,
      capture: true,
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

  const onControlPointerDown = (index: number, e: ReactPointerEvent<SVGCircleElement>) => {
    const { domNode } = xyflowStore.getState()
    if (!domNode || e.pointerType !== 'mouse') {
      return
    }

    switch (e.button) {
      case 0:
        onLmbControlPointerDown(index, e, domNode)
        break
      case 2:
        onRmbControlPointerDown(index, e, domNode)
        break
    }
  }

  const onEdgePointerDown = (e: ReactPointerEvent<SVGElement>) => {
    const { domNode } = xyflowStore.getState()

    if (!domNode || e.pointerType !== 'mouse') {
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
  }

  let zIndex = ZIndexes.Edge
  if (hovered || active) {
    // Move above the elements
    zIndex = ZIndexes.Element + 1
  }

  let edgeLabel = (
    <EdgeLabel edgeProps={props}>
      {!isControlPointDragging && navigateTo && (
        <EdgeActionButton
          {...props}
          onClick={e => {
            e.stopPropagation()
            diagram.navigateTo(navigateTo)
          }} />
      )}
    </EdgeLabel>
  )

  if (!isControlPointDragging && !isPanning) {
    const notes = props.data.notes
    if (notes && activeWalkthroughStep === props.id) {
      edgeLabel = (
        <NotePopover notes={notes}>
          {edgeLabel}
        </NotePopover>
      )
    } else if (enableRelationshipDetails) {
      edgeLabel = (
        <RelationshipsDropdownMenu
          disabled={!!dimmed}
          source={source}
          target={target}
          edgeId={edgeId}>
          {edgeLabel}
        </RelationshipsDropdownMenu>
      )
    }
  }

  return (
    <>
      <EdgeContainer {...props} className={clsx(isControlPointDragging && edgesCss.controlDragging)}>
        <EdgePath
          edgeProps={props}
          svgPath={edgePath}
          ref={svgPathRef}
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
          {edgeLabel}
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
                  onPointerDown={e => onControlPointerDown(i, e)}
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
