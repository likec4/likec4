import {
  invariant,
  type NonEmptyArray,
  nonexhaustive,
  nonNullable,
  type Point,
  type RelationshipArrowType
} from '@likec4/core'
import { Box } from '@mantine/core'
import { useIsomorphicLayoutEffect } from '@react-hookz/web'
import { assignInlineVars } from '@vanilla-extract/dynamic'
import type { EdgeProps, XYPosition } from '@xyflow/react'
import { EdgeLabelRenderer } from '@xyflow/react'
import clsx from 'clsx'
import { curveCatmullRomOpen, line as d3line } from 'd3-shape'
import { deepEqual, deepEqual as eq } from 'fast-equals'
import { memo, type PointerEvent as ReactPointerEvent, useRef, useState } from 'react'
import { first, hasAtLeast, isArray, isTruthy, last } from 'remeda'
import { useDiagramState, useDiagramStoreApi } from '../../state/hooks'
import { ZIndexes } from '../const'
import { EdgeMarkers } from '../EdgeMarkers'
import { useXYStoreApi } from '../hooks'
import { type RelationshipData, type XYFlowEdge } from '../types'
import { bezierControlPoints } from '../utils'
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

const toMarker = (arrowType?: RelationshipArrowType) => {
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

// If points are within 3px, consider them the same
const isSame = (a: number, b: number) => {
  return Math.abs(a - b) < 3.1
}

const isSamePoint = (a: XYPosition | Point, b: XYPosition | Point) => {
  const [ax, ay] = isArray(a) ? a : [a.x, a.y]
  const [bx, by] = isArray(b) ? b : [b.x, b.y]
  return isSame(ax, bx) && isSame(ay, by)
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
  && eq(prev.data.stepNum, next.data.stepNum)
  && sameControlPoints(prev.data.controlPoints, next.data.controlPoints)
  && eq(prev.data.edge, next.data.edge)
)

const curve = d3line<XYPosition>()
  .curve(curveCatmullRomOpen)
  .x(d => d.x)
  .y(d => d.y)

export const RelationshipEdge = /* @__PURE__ */ memo<EdgeProps<XYFlowEdge>>(function RelationshipEdgeR({
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
  const { isActive, isEditable, isEdgePathEditable, isHovered, isDimmed } = useDiagramState(s => ({
    isEditable: s.readonly !== true,
    isEdgePathEditable: s.readonly !== true && s.experimentalEdgeEditing === true,
    isActive: s.focusedNodeId === source || s.focusedNodeId === target
      || (s.activeDynamicViewStep !== null && s.activeDynamicViewStep === data.stepNum),
    isHovered: s.hoveredEdgeId === id,
    isDimmed: s.dimmed.has(id)
  }))
  const { nodeLookup, edgeLookup } = xyflowStore.getState()
  const sourceNode = nonNullable(nodeLookup.get(source)!, `source node ${source} not found`)
  const targetNode = nonNullable(nodeLookup.get(target)!, `target node ${target} not found`)

  const isModified = isEditable && (0
    || isTruthy(data.controlPoints)
    || !isSamePoint(sourceNode.internals.positionAbsolute, sourceNode.data.element.position)
    || !isSamePoint(targetNode.internals.positionAbsolute, targetNode.data.element.position))

  const {
    label,
    edge: {
      points: diagramEdgePoints,
      line = 'dashed',
      color = 'gray',
      ...diagramEdge
    }
  } = data

  let controlPoints = data.controlPoints ?? bezierControlPoints(data.edge)

  const isStepEdge = data.stepNum !== null
  const isDotted = line === 'dotted'
  const isDashed = isDotted || line === 'dashed'

  let strokeDasharray: string | undefined
  if (isDotted) {
    strokeDasharray = '1,8'
  } else if (isDashed) {
    strokeDasharray = '8,10'
  }

  let labelX = label?.bbox.x ?? 0,
    labelY = label?.bbox.y ?? 0

  const [labelPos, setLabelPosition] = useState<XYPosition>({
    x: labelX,
    y: labelY
  })

  let edgePath: string

  if (isModified) {
    labelX = labelPos.x
    labelY = labelPos.y
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
    // if (diagramEdge.tailArrowPoint) {
    //   edgePath = `M ${diagramEdge.tailArrowPoint[0]},${diagramEdge.tailArrowPoint[1]} L ${edgePath.substring(1)}`
    // }
    // if (diagramEdge.headArrowPoint) {
    //   edgePath += ` L ${diagramEdge.headArrowPoint[0]},${diagramEdge.headArrowPoint[1]}`
    // }
  }

  const svgPathRef = useRef<SVGPathElement>(null)
  useIsomorphicLayoutEffect(() => {
    const path = svgPathRef.current
    if (!path) return
    const dompoint = path.getPointAtLength(path.getTotalLength() * 0.5)
    const point = {
      x: Math.round(dompoint.x),
      y: Math.round(dompoint.y)
    }
    setLabelPosition(current => isSamePoint(current, point) ? current : point)
  }, [edgePath])

  const onControlPointerDown = (index: number, e: ReactPointerEvent<SVGCircleElement>) => {
    const { domNode } = xyflowStore.getState()
    if (!domNode || e.pointerType !== 'mouse') {
      return
    }
    const { xyflow } = diagramStore.getState()
    if (e.button === 2 && controlPoints.length > 1) {
      const newControlPoints = controlPoints.slice()
      newControlPoints.splice(index, 1)
      e.stopPropagation()
      // Defer the update to avoid conflict with the pointerup event
      setTimeout(() => {
        xyflow.updateEdgeData(id, { controlPoints: newControlPoints })
      }, 10)
      return
    }
    if (e.button !== 0) {
      return
    }
    e.stopPropagation()
    let hasMoved = false
    let pointer = { x: e.clientX, y: e.clientY }
    const onPointerMove = (e: PointerEvent) => {
      if (!isSamePoint(pointer, [e.clientX, e.clientY])) {
        setIsControlPointDragging(true)
        if (!hasMoved) {
          diagramStore.getState().cancelSaveManualLayout()
        }
        hasMoved = true
        pointer = { x: e.clientX, y: e.clientY }
        const { x, y } = xyflow.screenToFlowPosition(pointer, { snapToGrid: false })
        const newControlPoints = controlPoints.slice()
        newControlPoints[index] = {
          x: Math.round(x),
          y: Math.round(y)
        }
        xyflow.updateEdgeData(id, { controlPoints: newControlPoints })
      }
    }
    const onPointerUp = () => {
      setIsControlPointDragging(false)
      domNode.removeEventListener('pointermove', onPointerMove)
      domNode.removeEventListener('pointerup', onPointerUp)
      if (hasMoved) {
        diagramStore.getState().triggerSaveManualLayout()
      }
    }
    domNode.addEventListener('pointermove', onPointerMove)
    domNode.addEventListener('pointerup', onPointerUp, { once: true })
  }

  let markerStartName = toMarker(diagramEdge.tail)
  let markerEndName = toMarker(diagramEdge.head ?? 'normal')
  if (diagramEdge.dir === 'back') {
    ;[markerStartName, markerEndName] = [markerEndName, markerStartName]
  }

  const MarkerStart = markerStartName ? EdgeMarkers[markerStartName] : null
  const MarkerEnd = markerEndName ? EdgeMarkers[markerEndName] : null

  return (
    <g
      className={clsx([
        edgesCss.container,
        isDimmed && edgesCss.dimmed,
        isControlPointDragging && edgesCss.controlDragging
      ])}
      data-likec4-color={color}
      data-edge-dir={diagramEdge.dir}
      data-edge-active={isActive}
      data-edge-hovered={isHovered}>
      <path
        className={clsx('react-flow__edge-interaction')}
        d={edgePath}
        fill="none"
        stroke={'transparent'}
        strokeWidth={interactionWidth ?? 10}
      />
      <g className={edgesCss.markerContext}>
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
          {...({
            isDimmed,
            color,
            isModified,
            labelX,
            labelY,
            isEdgePathEditable,
            selected: selected ?? false,
            stepNum: data.stepNum,
            label: data.label,
            zIndex: edgeLookup.get(id)!.zIndex ?? ZIndexes.Edge,
            isHovered,
            isActive,
            isStepEdge
          })} />
      )}
    </g>
  )
}, isEqualProps)

type EdgeLabelProps = {
  isDimmed: boolean
  color: string
  isModified: boolean
  labelX: number
  labelY: number
  isEdgePathEditable: boolean
  selected: boolean
  stepNum: number | null
  label: RelationshipData['label']
  isHovered: boolean
  isActive: boolean
  zIndex: number
}

const EdgeLabel = memo<EdgeLabelProps>(({
  isDimmed,
  color,
  isModified,
  labelX,
  labelY,
  isEdgePathEditable,
  selected,
  label,
  stepNum,
  isHovered,
  isActive,
  zIndex
}) => {
  return (
    <EdgeLabelRenderer>
      <Box
        className={clsx([
          'nodrag nopan',
          edgesCss.container,
          edgesCss.edgeLabel,
          isDimmed && edgesCss.dimmed
        ])}
        style={{
          ...assignInlineVars({
            [edgesCss.varLabelX]: isModified ? `calc(${labelX}px - 10%)` : `${labelX}px`,
            [edgesCss.varLabelY]: isModified ? `${labelY - 5}px` : `${labelY}px`
          }),
          ...(isEdgePathEditable && selected && {
            pointerEvents: 'none'
          }),
          ...(label && {
            maxWidth: label.bbox.width + 18
          }),
          zIndex
        }}
        mod={{
          'data-likec4-color': color,
          'data-edge-hovered': isHovered,
          'data-edge-active': isActive
        }}
      >
        {stepNum !== null && (
          <Box className={edgesCss.stepEdgeNumber}>
            {stepNum}
          </Box>
        )}
        {isTruthy(label?.text) && (
          <Box className={edgesCss.edgeLabelText}>
            {label.text}
          </Box>
        )}
      </Box>
    </EdgeLabelRenderer>
  )
}, deepEqual)
