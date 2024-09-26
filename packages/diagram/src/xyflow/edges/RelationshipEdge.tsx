import {
  invariant,
  isStepEdgeId,
  type NonEmptyArray,
  nonexhaustive,
  nonNullable,
  type Point,
  type RelationshipArrowType
} from '@likec4/core'
import { useDebouncedEffect } from '@react-hookz/web'
import { assignInlineVars } from '@vanilla-extract/dynamic'
import type { EdgeProps, XYPosition } from '@xyflow/react'
import clsx from 'clsx'
import { curveCatmullRomOpen, line as d3line } from 'd3-shape'
import { deepEqual as eq } from 'fast-equals'
import { memo, type PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from 'react'
import { first, hasAtLeast, isArray, isTruthy, last } from 'remeda'
import { useDiagramState, useDiagramStoreApi } from '../../hooks/useDiagramState'
import { useXYStoreApi } from '../../hooks/useXYFlow'
import { vector, VectorImpl } from '../../utils/vector'
import { ZIndexes } from '../const'
import { EdgeMarkers, type EdgeMarkerType } from '../EdgeMarkers'
import { type XYFlowEdge } from '../types'
import { bezierControlPoints } from '../utils'
import { EdgeLabel } from './EdgeLabel'
import * as edgesCss from './edges.css'
import { getNodeIntersectionFromCenterToPoint } from './utils'
// import { getEdgeParams } from './utils'

// function getBend(a: XYPosition, b: XYPosition, c: XYPosition, size = 8): string {
//   const bendSize = Math.min(distance(a, b) / 2, distance(b, c) / 2, size)
//   const { x, y } = b
//   // no bend
//   if ((a.x === x && x === c.x) || (a.y === y && y === c.y)) {
//     return `L${x} ${y}`
//   }

//   // first segment is horizontal
//   if (a.y === y) {
//     const xDir = a.x < c.x ? -1 : 1
//     const yDir = a.y < c.y ? 1 : -1
//     return `L ${x + bendSize * xDir},${y}Q ${x},${y} ${x},${y + bendSize * yDir}`
//   }

//   const xDir = a.x < c.x ? 1 : -1
//   const yDir = a.y < c.y ? -1 : 1
//   return `L ${x},${y + bendSize * yDir}Q ${x},${y} ${x + bendSize * xDir},${y}`
// }

// const reduceToPath = (path: string, p: XYPosition, i: number, points: XYPosition[]) => {
//   let segment = ''
//   if (i > 0 && i < points.length - 1) {
//     segment = getBend(points[i - 1]!, p, points[i + 1]!)
//   } else {
//     segment = `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`
//   }
//   return path + segment
// }

const toMarker = (arrowType?: RelationshipArrowType): EdgeMarkerType | undefined => {
  if (!arrowType || arrowType === 'none') {
    return undefined
  }
  switch (arrowType) {
    case 'normal':
    case 'crow':
      return 'Arrow' as const
    case 'onormal':
      return 'OArrow' as const
    case 'diamond':
      return 'Diamond' as const
    case 'odiamond':
      return 'ODiamond' as const
    case 'open':
    case 'vee':
      return 'Open' as const
    case 'dot':
      return 'Dot' as const
    case 'odot':
      return `ODot` as const
    default:
      nonexhaustive(arrowType)
  }
}

function bezierPath(bezierSpline: NonEmptyArray<Point>) {
  let [start, ...points] = bezierSpline
  invariant(start, 'start should be defined')
  let path = `M ${start[0]},${start[1]}`

  while (hasAtLeast(points, 3)) {
    const [cp1, cp2, end, ...rest] = points
    path = path + ` C ${cp1[0]},${cp1[1]} ${cp2[0]},${cp2[1]} ${end[0]},${end[1]}`
    points = rest
  }
  invariant(points.length === 0, 'all points should be consumed')

  return path
}

// If points are within 1px, consider them the same
const isSame = (a: number, b: number) => {
  return Math.abs(a - b) < 2.5
}

const isSamePoint = (a: XYPosition | Point, b: XYPosition | Point) => {
  return isSame(isArray(a) ? a[0] : a.x, isArray(b) ? b[0] : b.x)
    && isSame(isArray(a) ? a[1] : a.y, isArray(b) ? b[1] : b.y)
}

const sameControlPoints = (a: XYPosition[] | null, b: XYPosition[] | null) => {
  if (a === b) return true
  if (!a || !b || a.length !== b.length) return false
  return a.every((ap, i) => isSamePoint(ap, b[i]!))
}

const isEqualProps = (prev: EdgeProps<XYFlowEdge>, next: EdgeProps<XYFlowEdge>) => (
  prev.id === next.id
  && eq(prev.source, next.source)
  && eq(prev.target, next.target)
  && eq(prev.selected ?? false, next.selected ?? false)
  && isSame(prev.sourceX, next.sourceX)
  && isSame(prev.sourceY, next.sourceY)
  && isSame(prev.targetX, next.targetX)
  && isSame(prev.targetY, next.targetY)
  && eq(prev.data.label, next.data.label)
  && sameControlPoints(prev.data.controlPoints, next.data.controlPoints)
  && eq(prev.data.edge, next.data.edge)
)

const curve = d3line<XYPosition>()
  .curve(curveCatmullRomOpen)
  .x(d => d.x)
  .y(d => d.y)

export const RelationshipEdge = memo<EdgeProps<XYFlowEdge>>(function RelationshipEdgeR({
  id,
  data,
  selected,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style,
  source,
  target,
  interactionWidth
}) {
  const [isControlPointDragging, setIsControlPointDragging] = useState(false)
  const diagramStore = useDiagramStoreApi()
  const xyflowStore = useXYStoreApi()
  const {
    connectedToFocusedNode,
    isActiveWalkthroughStep,
    isEdgePathEditable,
    isHovered,
    isDimmed,
    isActiveAsParallel
  } = useDiagramState(s => ({
    isEdgePathEditable: s.readonly !== true && s.experimentalEdgeEditing === true && s.focusedNodeId === null
      && s.activeWalkthrough === null,
    connectedToFocusedNode: s.focusedNodeId === source || s.focusedNodeId === target,
    isActiveWalkthroughStep: s.activeWalkthrough?.stepId === data.edge.id,
    // If activeWalkthrough and this edge is part of the parallel group
    isActiveAsParallel: !!s.activeWalkthrough?.parallelPrefix && id.startsWith(s.activeWalkthrough.parallelPrefix),
    isHovered: s.hoveredEdgeId === id,
    isDimmed: s.dimmed.has(id)
  }))

  const isActive = connectedToFocusedNode || isActiveWalkthroughStep
  const { nodeLookup, edgeLookup } = xyflowStore.getState()
  const sourceNode = nonNullable(nodeLookup.get(source)!, `source node ${source} not found`)
  const targetNode = nonNullable(nodeLookup.get(target)!, `target node ${target} not found`)

  const isModified = isTruthy(data.controlPoints)
    || !isSamePoint(sourceNode.internals.positionAbsolute, sourceNode.data.element.position)
    || !isSamePoint(targetNode.internals.positionAbsolute, targetNode.data.element.position)

  const {
    label,
    edge: {
      points: diagramEdgePoints,
      line = 'dashed',
      color = 'gray',
      labelBBox,
      ...diagramEdge
    }
  } = data

  let controlPoints = data.controlPoints ?? bezierControlPoints(data.edge)

  const isStepEdge = isStepEdgeId(data.edge.id)
  const isDotted = line === 'dotted'
  const isDashed = isDotted || line === 'dashed'

  let strokeDasharray: string | undefined
  if (isDotted) {
    strokeDasharray = '1,8'
  } else if (isDashed) {
    strokeDasharray = '8,10'
  }

  let labelX = labelBBox?.x ?? 0,
    labelY = labelBBox?.y ?? 0

  const [labelPos, setLabelPos] = useState<XYPosition>({
    x: label?.bbox.x ?? labelX,
    y: label?.bbox.y ?? labelY
  })

  let edgePath: string

  if (isModified) {
    const sourceCenterPos = { x: sourceX, y: sourceY }
    const targetCenterPos = { x: targetX, y: targetY }

    const points = diagramEdge.dir === 'back'
      ? [
        targetCenterPos,
        getNodeIntersectionFromCenterToPoint(targetNode, first(controlPoints) ?? sourceCenterPos),
        ...controlPoints,
        getNodeIntersectionFromCenterToPoint(sourceNode, last(controlPoints) ?? targetCenterPos),
        sourceCenterPos
      ]
      : [
        sourceCenterPos,
        getNodeIntersectionFromCenterToPoint(sourceNode, first(controlPoints) ?? targetCenterPos),
        ...controlPoints,
        getNodeIntersectionFromCenterToPoint(targetNode, last(controlPoints) ?? sourceCenterPos),
        targetCenterPos
      ]

    edgePath = nonNullable(curve(points))
  } else {
    edgePath = bezierPath(diagramEdgePoints)
  }

  const svgPathRef = useRef<SVGPathElement>(null)
  useEffect(() => {
    const path = svgPathRef.current
    if (!path) return
    const dompoint = path.getPointAtLength(path.getTotalLength() * 0.5)
    const point = {
      x: Math.round(dompoint.x),
      y: Math.round(dompoint.y)
    }
    setLabelPos(current => isSamePoint(current, point) ? current : point)
  }, [edgePath])

  useDebouncedEffect(
    () => {
      if (!label || label.bbox.x === labelPos.x && label.bbox.y === labelPos.y) {
        return
      }
      diagramStore.getState().xyflow.updateEdgeData(id, {
        label: {
          ...label,
          bbox: {
            ...label.bbox,
            ...labelPos
          }
        }
      })
    },
    [labelPos],
    50,
    300
  )

  if (isModified || isControlPointDragging) {
    labelX = labelPos.x
    labelY = labelPos.y
  }

  const onLmbControlPointerDown = (index: number, e: ReactPointerEvent<SVGCircleElement>, domNode: HTMLDivElement) => {
    const { addSelectedEdges } = xyflowStore.getState()
    const { xyflow } = diagramStore.getState()

    addSelectedEdges([id])

    const wasCanceled = diagramStore.getState().cancelSaveManualLayout()
    e.stopPropagation()
    let hasMoved = false
    let pointer = { x: e.clientX, y: e.clientY }

    const onPointerMove = (e: PointerEvent) => {
      const clientPoint = {
        x: e.clientX,
        y: e.clientY
      }
      if (!isSamePoint(pointer, clientPoint)) {
        setIsControlPointDragging(true)
        hasMoved = true
        pointer = clientPoint
        const { x, y } = xyflow.screenToFlowPosition(pointer, { snapToGrid: false })
        xyflow.updateEdgeData(id, xyedge => {
          const cp = (xyedge.data.controlPoints ?? controlPoints).slice()
          cp[index] = {
            x: Math.round(x),
            y: Math.round(y)
          }
          return {
            controlPoints: cp
          }
        })
      }
      e.stopPropagation()
    }

    const onPointerUp = (e: PointerEvent) => {
      domNode.removeEventListener('pointermove', onPointerMove, {
        capture: true
      })
      if (hasMoved) {
        e.stopPropagation()
      }
      if (hasMoved || wasCanceled) {
        diagramStore.getState().scheduleSaveManualLayout()
      }
      setIsControlPointDragging(false)
    }

    domNode.addEventListener('pointermove', onPointerMove, {
      capture: true
    })
    domNode.addEventListener('pointerup', onPointerUp, {
      once: true,
      capture: true
    })
  }

  const onRmbControlPointerDown = (index: number, e: ReactPointerEvent<SVGCircleElement>, domNode: HTMLDivElement) => {
    const { xyflow } = diagramStore.getState()

    if(controlPoints.length <= 1) {
      return
    }

    const onPointerUp = (e: PointerEvent) => {
      const newControlPoints = controlPoints.slice()
      newControlPoints.splice(index, 1)
      e.stopPropagation()
      // Defer the update to avoid conflict with the pointerup event
      setTimeout(() => {
        xyflow.updateEdgeData(id, { controlPoints: newControlPoints })
        diagramStore.getState().scheduleSaveManualLayout()
      }, 10)

      domNode.removeEventListener('pointerup', onPointerUp, {
        capture: true
      })
      e.stopPropagation()      
    }

    domNode.addEventListener('pointerup', onPointerUp, {
      once: true,
      capture: true
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
    const { xyflow, scheduleSaveManualLayout } = diagramStore.getState()

    if (!domNode || e.pointerType !== 'mouse') {
      return
    }
    if (e.button !== 2) {
      return
    }

    xyflow.updateEdgeData(id, edge => {
      const points: VectorImpl[] = [
        new VectorImpl(sourceX, sourceY),
        ...controlPoints.map(vector) || [],
        new VectorImpl(targetX, targetY)
      ]

      let pointer = { x: e.clientX, y: e.clientY }
      const newPoint = vector(xyflow.screenToFlowPosition(pointer, { snapToGrid: false }))

      let insertionIndex = 0
      let minDistance = Infinity
      for (let i = 0; i < points.length - 1; i++) {
        const a = points[i]!, b = points[i + 1]!
        const fromCurrentToNext = b.sub(a)
        const fromCurrentToNew = newPoint.sub(a)
        const fromNextToNew = newPoint.sub(b)

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

      const newControlPoints = edge.data.controlPoints?.slice() || []
      newControlPoints.splice(insertionIndex, 0, newPoint)

      return { controlPoints: newControlPoints }
    })

    scheduleSaveManualLayout()

    e.stopPropagation()
  }

  let markerStartName = toMarker(diagramEdge.tail)
  let markerEndName = toMarker(diagramEdge.head ?? 'normal')
  if (diagramEdge.dir === 'back') {
    ;[markerStartName, markerEndName] = [markerEndName, markerStartName]
  }

  const MarkerStart = markerStartName ? EdgeMarkers[markerStartName] : null
  const MarkerEnd = markerEndName ? EdgeMarkers[markerEndName] : null

  let labelZIndex = 1 + (isHovered ? ZIndexes.Element : (edgeLookup.get(id)!.zIndex ?? ZIndexes.Edge))
  if (isEdgePathEditable && selected) {
    // Move label below ControlPoints, otherwise they don't capture events
    labelZIndex = (edgeLookup.get(id)!.zIndex ?? ZIndexes.Edge) - 1
  }

  return (
    <g
      className={clsx(
        edgesCss.container,
        isDimmed && edgesCss.dimmed,
        isControlPointDragging && edgesCss.controlDragging
      )}
      data-likec4-color={color}
      data-edge-dir={diagramEdge.dir}
      data-edge-active={isActive}
      data-edge-animated={isActive || isActiveAsParallel}
      data-edge-hovered={isHovered}>
      <path
        className={clsx('react-flow__edge-interaction')}
        d={edgePath}
        fill="none"
        stroke={'transparent'}
        strokeWidth={interactionWidth ?? 10}
      />
      <g className={edgesCss.markerContext} onPointerDown={e => onEdgePointerDown(e)}>
        <defs>
          {MarkerStart && <MarkerStart id={'start' + id} />}
          {MarkerEnd && <MarkerEnd id={'end' + id} />}
        </defs>
        <path
          className={clsx('react-flow__edge-path', edgesCss.edgePathBg)}
          d={edgePath}
          style={style}
          strokeLinecap={'round'}
        />
        <path
          ref={svgPathRef}
          className={clsx('react-flow__edge-path', edgesCss.cssEdgePath)}
          d={edgePath}
          style={style}
          strokeLinecap={'round'}
          strokeDasharray={strokeDasharray}
          markerStart={MarkerStart ? `url(#start${id})` : undefined}
          markerEnd={MarkerEnd ? `url(#end${id})` : undefined}
        />
      </g>

      {isEdgePathEditable && (
        <g
          onContextMenu={e => {
            e.preventDefault()
            e.stopPropagation()
          }}>
          {controlPoints.map((p, i) => (
            <circle
              onPointerDown={e => onControlPointerDown(i, e)}
              className={edgesCss.controlPoint}
              key={i}
              cx={p.x}
              cy={p.y}
              r={3}
            />
          ))}
        </g>
      )}
      {(data.label || isStepEdge) && (
        <EdgeLabel
          isDimmed={isDimmed}
          edgeData={data}
          className={clsx(
            'nodrag nopan',
            edgesCss.container,
            edgesCss.edgeLabel,
            isDimmed && edgesCss.dimmed
          )}
          style={{
            ...assignInlineVars({
              [edgesCss.varLabelX]: isModified ? `calc(${labelX}px - 10%)` : `${labelX}px`,
              [edgesCss.varLabelY]: isModified ? `${labelY - 5}px` : `${labelY}px`
            }),
            // ...(isEdgePathEditable && selected && {
            //   pointerEvents: 'none'
            // }),
            ...(label && {
              maxWidth: label.bbox.width + 18
            }),
            zIndex: labelZIndex
          }}
          mod={{
            'data-likec4-color': color,
            'data-edge-hovered': isHovered && !isActiveWalkthroughStep,
            'data-edge-active': isActive
          }}
        />
      )}
    </g>
  )
}, isEqualProps)
