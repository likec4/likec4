import { invariant, type NonEmptyArray, nonNullable, type Point } from '@likec4/core'
import { Box } from '@mantine/core'
import { useIsomorphicLayoutEffect } from '@react-hookz/web'
import { assignInlineVars } from '@vanilla-extract/dynamic'
import type { EdgeProps, XYPosition } from '@xyflow/react'
import { EdgeLabelRenderer } from '@xyflow/react'
import { getNodePositionWithOrigin } from '@xyflow/system'
import clsx from 'clsx'
import { curveCatmullRomOpen, line as d3line } from 'd3-shape'
import { deepEqual, deepEqual as eq } from 'fast-equals'
import { memo, useRef, useState } from 'react'
import { first, hasAtLeast, isArray, isNullish, isTruthy, last } from 'remeda'
import { useDiagramState, useDiagramStoreApi } from '../../state/hooks'
import { ZIndexes } from '../const'
import { useXYStoreApi } from '../hooks'
import { type RelationshipData, type XYFlowEdge } from '../types'
import { bezierControlPoints, toDomPrecision } from '../utils'
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
  && prev.source === next.source
  && prev.target === next.target
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
  style,
  source,
  target,
  interactionWidth
}) {
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
    const sourceCenterPos = getNodePositionWithOrigin(sourceNode, [-0.5, -0.5])
    const targetCenterPos = getNodePositionWithOrigin(targetNode, [-0.5, -0.5])

    const points = diagramEdge.dir === 'back'
      ? [
        targetCenterPos.positionAbsolute,
        getNodeIntersectionFromCenterToPoint(targetNode, first(controlPoints)!),
        ...controlPoints,
        getNodeIntersectionFromCenterToPoint(sourceNode, last(controlPoints)!),
        sourceCenterPos.positionAbsolute
      ]
      : [
        sourceCenterPos.positionAbsolute,
        getNodeIntersectionFromCenterToPoint(sourceNode, first(controlPoints)!),
        ...controlPoints,
        getNodeIntersectionFromCenterToPoint(targetNode, last(controlPoints)!),
        targetCenterPos.positionAbsolute
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

  const onControlPointerDown = (index: number, e: React.PointerEvent) => {
    const { domNode } = xyflowStore.getState()
    if (!domNode) return
    const { xyflow } = diagramStore.getState()
    e.stopPropagation()
    let hasMoved = false
    let pointer = { x: e.clientX, y: e.clientY }
    const onPointerMove = (e: PointerEvent) => {
      if (!isSamePoint(pointer, [e.clientX, e.clientY])) {
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
      domNode.removeEventListener('pointermove', onPointerMove)
      domNode.removeEventListener('pointerup', onPointerUp)
      if (hasMoved) {
        diagramStore.getState().triggerSaveManualLayout()
      }
    }
    domNode.addEventListener('pointermove', onPointerMove)
    domNode.addEventListener('pointerup', onPointerUp, { once: true })
  }

  const onControlPointerDoubleClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    const { xyflow } = diagramStore.getState()
    const newControlPoints = controlPoints.slice()
    newControlPoints.splice(index, 1)
    xyflow.updateEdgeData(id, { controlPoints: newControlPoints })
  }

  const marker = `url(#arrow-${id})`
  let markerStart = diagramEdge.tail && diagramEdge.tail !== 'none' ? marker : undefined
  let markerEnd = isNullish(diagramEdge.head) || diagramEdge.head !== 'none' ? marker : undefined
  if (diagramEdge.dir === 'back') {
    ;[markerStart, markerEnd] = [markerEnd, markerStart]
  }

  return (
    <g
      className={clsx([
        edgesCss.container,
        isDimmed && edgesCss.dimmed
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
        strokeDasharray={0}
        strokeWidth={interactionWidth ?? 10}
      />
      <g className={edgesCss.markerContext}>
        <defs>
          <marker
            id={`arrow-${id}`}
            viewBox="0 0 16 10"
            // TODO: graphviz cut bezier path at arrow, we don't
            refX={isModified ? '16' : '4'}
            refY="5"
            markerWidth="5"
            markerHeight="4"
            markerUnits="strokeWidth"
            preserveAspectRatio="xMaxYMid meet"
            orient="auto-start-reverse">
            <path
              d="M 0 0 L 16 5 L 0 10 z"
              stroke="context-stroke"
              fill="context-stroke"
              strokeDasharray={0}
              strokeWidth={1}
            />
          </marker>
        </defs>
        <path
          className={clsx('react-flow__edge-path', edgesCss.edgePathBg)}
          d={edgePath}
          style={style}
          strokeDasharray={0}
          strokeLinecap={'round'}
        />
        <path
          ref={svgPathRef}
          className={clsx('react-flow__edge-path', edgesCss.cssEdgePath)}
          d={edgePath}
          style={style}
          strokeLinecap={'round'}
          strokeDasharray={strokeDasharray}
          markerStart={markerStart}
          markerEnd={markerEnd}
        />
      </g>
      {isEdgePathEditable && controlPoints.map((p, i) => (
        <circle
          onPointerDown={e => onControlPointerDown(i, e)}
          {...(selected && controlPoints.length > 1 && {
            onDoubleClick: e => {
              onControlPointerDoubleClick(i, e)
            }
          })}
          className={edgesCss.controlPoint}
          key={i}
          cx={p.x}
          cy={p.y}
          r={3}
        />
      ))}
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
            maxWidth: label.bbox.width + 20
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
