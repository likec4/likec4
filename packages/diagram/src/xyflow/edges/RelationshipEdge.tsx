import { invariant, type NonEmptyArray, nonNullable, type Point } from '@likec4/core'
import { Box } from '@mantine/core'
import { assignInlineVars } from '@vanilla-extract/dynamic'
import type { EdgeProps, XYPosition } from '@xyflow/react'
import { EdgeLabelRenderer, getBezierPath } from '@xyflow/react'
import { getNodePositionWithOrigin } from '@xyflow/system'
import { Bezier } from 'bezier-js'
import clsx from 'clsx'
import { curveCatmullRomOpen, line as d3line } from 'd3-shape'
import { deepEqual as eq } from 'fast-equals'
import { type CSSProperties, memo } from 'react'
import { first, hasAtLeast, last } from 'remeda'
import { useDiagramState } from '../../state'
import { ZIndexes } from '../const'
import { useXYStoreApi } from '../hooks'
import { type XYFlowEdge } from '../types'
import { toDomPrecision } from '../utils'
import * as edgesCss from './edges.css'
import { getEdgeParams, getNodeIntersectionFromCenterToPoint } from './utils'
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
const isSamePoint = (a: number, b: number) => {
  return Math.abs(a - b) < 3.1
}

const isSamePosition = (a: XYPosition, [bx, by]: Point) => {
  return isSamePoint(a.x, bx) && isSamePoint(a.y, by)
}

const isEqualProps = (prev: EdgeProps<XYFlowEdge>, next: EdgeProps<XYFlowEdge>) => (
  prev.id === next.id
  && prev.source === next.source
  && prev.target === next.target
  && eq(prev.selected ?? false, next.selected ?? false)
  && isSamePoint(prev.sourceX, next.sourceX)
  && isSamePoint(prev.sourceY, next.sourceY)
  && isSamePoint(prev.targetX, next.targetX)
  && isSamePoint(prev.targetY, next.targetY)
  && eq(prev.data, next.data)
)

const curve = d3line<Point>()
  .curve(curveCatmullRomOpen)

export const RelationshipEdge = /* @__PURE__ */ memo<EdgeProps<XYFlowEdge>>(function RelationshipEdgeR({
  id,
  data,
  selected: _selected,
  style,
  source,
  target,
  interactionWidth
}) {
  const { nodeLookup, edgeLookup } = useXYStoreApi().getState()
  const sourceNode = nonNullable(nodeLookup.get(source)!, `source node ${source} not found`)
  const targetNode = nonNullable(nodeLookup.get(target)!, `target node ${target} not found`)

  const isModified = !isSamePosition(sourceNode.internals.positionAbsolute, sourceNode.data.element.position)
    || !isSamePosition(targetNode.internals.positionAbsolute, targetNode.data.element.position)

  const { edge: diagramEdge, controlPoints } = data
  // const edgePath = bezierPath(edge.points)

  const color = diagramEdge.color ?? 'gray'
  const isHovered = useDiagramState(s => s.hoveredEdgeId === id)

  const line = diagramEdge.line ?? 'dashed'
  const isDotted = line === 'dotted'
  const isDashed = isDotted || line === 'dashed'

  let strokeDasharray: string | undefined
  if (isDotted) {
    strokeDasharray = '1,8'
  } else if (isDashed) {
    strokeDasharray = '8,10'
  }

  const marker = `url(#arrow-${id})`

  let edgePath: string, labelX: number, labelY: number

  if (!isModified) {
    edgePath = bezierPath(diagramEdge.points)
    labelX = data.label?.bbox.x ?? 0
    labelY = data.label?.bbox.y ?? 0
  } else {
    const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(sourceNode, targetNode)

    const [_edgePath, _labelX, _labelY] = getBezierPath({
      sourceX: sx,
      sourceY: sy,
      sourcePosition: sourcePos,
      targetPosition: targetPos,
      targetX: tx,
      targetY: ty
    })
    edgePath = _edgePath
    labelX = _labelX
    labelY = _labelY

    const sourceCenterPos = getNodePositionWithOrigin(sourceNode, [-0.5, -0.5])
    const targetCenterPos = getNodePositionWithOrigin(targetNode, [-0.5, -0.5])

    edgePath = curve([
      [sourceCenterPos.positionAbsolute.x, sourceCenterPos.positionAbsolute.y],
      getNodeIntersectionFromCenterToPoint(sourceNode, first(controlPoints)!),
      ...controlPoints,
      getNodeIntersectionFromCenterToPoint(targetNode, last(controlPoints)!),
      [targetCenterPos.positionAbsolute.x, targetCenterPos.positionAbsolute.y]
    ])!
  }

  return (
    <g className={clsx(edgesCss.container)} data-likec4-color={color} data-edge-hovered={isHovered}>
      <g className={clsx(edgesCss.fillStrokeCtx)}>
        <defs>
          <marker
            id={`arrow-${id}`}
            viewBox="0 0 10 8"
            refX="0"
            refY="4"
            markerWidth="5"
            markerHeight="5"
            markerUnits="strokeWidth"
            preserveAspectRatio="xMaxYMid meet"
            orient="auto-start-reverse">
            <path d="M 0 0 L 10 4 L 0 8 z" stroke="context-stroke" fill="context-stroke" />
          </marker>
        </defs>
      </g>
      <RelationshipPath
        edgePath={edgePath}
        interactionWidth={interactionWidth ?? 10}
        strokeDasharray={strokeDasharray}
        markerStart={diagramEdge.tailArrow ? marker : undefined}
        markerEnd={diagramEdge.headArrow ? marker : undefined}
        style={style} />
      {isModified && controlPoints.map((p, i) => (
        <circle
          className={edgesCss.controlPoint}
          key={i}
          cx={p[0]}
          cy={p[1]}
          r={3}
        />
      ))}
      {data.label && (
        <EdgeLabelRenderer>
          <Box
            className={clsx(edgesCss.container, edgesCss.edgeLabel)}
            data-likec4-color={color}
            style={{
              ...assignInlineVars({
                [edgesCss.varLabelX]: toDomPrecision(labelX) + 'px',
                [edgesCss.varLabelY]: toDomPrecision(labelY) + 'px'
              }),
              maxWidth: data.label.bbox.width + 10,
              zIndex: edgeLookup.get(id)?.zIndex ?? ZIndexes.Edge
            }}
            mod={{
              'data-edge-hovered': isHovered
            }}
          >
            <Box className={edgesCss.edgeLabelBody}>
              {data.label.text}
            </Box>
            {
              /* <Popover
                position="bottom"
                floatingStrategy="fixed"
                shadow="lg"
                disabled={!selected}
                transitionProps={{
                  transition: 'pop'
                }}>
                <Popover.Target>
                  <Box className={clsx('nodrag nopan', edgeLabelBody)}>
                    {data.label.text}
                  </Box>
                </Popover.Target>
                <Popover.Dropdown>
                  {edge.relations.map((relation) => (
                    <Box key={relation}>
                      <Text size='xs'>{relation}</Text>
                    </Box>
                  ))}
                  <TextInput label="Name" placeholder="Name" size="xs" />
                  <TextInput label="Email" placeholder="john@doe.com" size="xs" mt="xs" />
                </Popover.Dropdown>
              </Popover> */
            }
          </Box>
        </EdgeLabelRenderer>
      )}
    </g>
  )
}, isEqualProps)

const RelationshipPath = ({
  edgePath,
  interactionWidth,
  strokeDasharray,
  markerStart,
  markerEnd,
  style
}: {
  edgePath: string
  interactionWidth: number
  strokeDasharray: string | undefined
  markerStart: string | undefined
  markerEnd: string | undefined
  style: CSSProperties | undefined
}) => (
  <>
    <path
      className={clsx('react-flow__edge-path', edgesCss.edgePathBg)}
      d={edgePath}
      style={style}
      strokeLinecap={'round'}
    />
    <path
      className={clsx('react-flow__edge-path', edgesCss.cssEdgePath)}
      d={edgePath}
      style={style}
      strokeLinecap={'round'}
      strokeDasharray={strokeDasharray}
      markerStart={markerStart}
      markerEnd={markerEnd}
    />
    <path
      className={clsx('react-flow__edge-interaction')}
      d={edgePath}
      fill="none"
      strokeOpacity={0}
      strokeWidth={interactionWidth}
    />
  </>
)
