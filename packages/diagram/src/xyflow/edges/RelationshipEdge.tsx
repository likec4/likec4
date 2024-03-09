import { invariant, type NonEmptyArray, type Point } from '@likec4/core'
import { Box, rem, Text } from '@mantine/core'
import { isEqualReactSimple } from '@react-hookz/deep-equal'
import type { EdgeProps } from '@xyflow/react'
import { EdgeLabelRenderer, getBezierPath, useStore } from '@xyflow/react'
import clsx from 'clsx'
import { deepEqual, shallowEqual } from 'fast-equals'
import { motion } from 'framer-motion'
import { useCallback } from 'react'
import { memo } from 'react-tracked'
import { hasAtLeast } from 'remeda'
import useTilg from 'tilg'
import { ZIndexes } from '../../const'
import { useDiagramStateSelector } from '../../state2'
import { useXYFlow } from '../hooks'
import { type RelationshipData, XYFlowNode } from '../types'
import * as css from './edges.css'
import { getEdgeParams } from './utils'
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

export const RelationshipEdge = memo<EdgeProps<RelationshipData>>(function RelationshipEdgeR({
  id,
  data,
  selected,
  markerEnd,
  style,
  source,
  target,
  interactionWidth,
  ...xyedge
}) {
  const xyflow = useXYFlow()
  const isModified = useStore(
    useCallback(s => {
      const sourceNode = s.nodeLookup.get(source)!
      const targetNode = s.nodeLookup.get(target)!
      invariant(XYFlowNode.is(sourceNode))
      invariant(XYFlowNode.is(targetNode))
      const isSourceModified = !!sourceNode.computed?.positionAbsolute
        && !deepEqual(sourceNode.computed.positionAbsolute, {
          x: sourceNode.data.element.position[0],
          y: sourceNode.data.element.position[1]
        })
      if (isSourceModified) {
        return true
      }
      return !!targetNode.computed?.positionAbsolute
        && !deepEqual(targetNode.computed.positionAbsolute, {
          x: targetNode.data.element.position[0],
          y: targetNode.data.element.position[1]
        })
    }, [source, target]),
    deepEqual
  )

  // const [sourceNode, targetNode] = useXYNodesData([xyedge.source, xyedge.target])

  // const isModified = !deepEqual(sourcePos.positionAbsolute, sourcePos.position) || !deepEqual(targetPos.positionAbsolute, targetPos.position)
  // const isModified `= sourceNode.computed?.positionAbsolute?.x !== sourceNode.data.element.position[0]
  //   || sourceNode.computed?.positionAbsolute?.y !== sourceNode.data.element.position[1]
  //   || targetNode.computed?.positionAbsolute?.x !== targetNode.data.element.position[0]
  //   || targetNode.computed?.positionAbsolute?.y !== targetNode.data.element.position[1]

  invariant(data, 'data isd required')
  const {
    edge,
    controlPoints
  } = data
  // const edgePath = bezierPath(edge.points)

  const color = edge.color ?? 'gray'
  const isHovered = useDiagramStateSelector(state => state.hoveredEdgeId === id)

  const line = edge.line ?? 'dashed'
  const isDotted = line === 'dotted'
  const isDashed = isDotted || line === 'dashed'

  let strokeDasharray: string | undefined
  if (isDotted) {
    strokeDasharray = '1,4'
  } else if (isDashed) {
    strokeDasharray = '8,8'
  }

  const marker = `url(#arrow-${id})`

  let edgePath: string, labelX: number, labelY: number

  if (isModified) {
    const sourceNode = xyflow.getNode(source)!
    const targetNode = xyflow.getNode(target)!
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
  } else {
    edgePath = bezierPath(edge.points)
    labelX = data.label?.bbox.x ?? 0
    labelY = data.label?.bbox.y ?? 0
  }

  useTilg()`
  ${id}
  path=${edgePath}
  isModified=${isModified}
`

  return (
    <g className={clsx(css.container)} data-likec4-color={color} data-edge-hovered={isHovered}>
      <g className={clsx(css.fillStrokeCtx)}>
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
            <path d="M 0 0 L 10 4 L 0 8 z" stroke="context-stroke" fill="context-fill" />
          </marker>
        </defs>
      </g>
      <path
        className={clsx('react-flow__edge-path', css.edgePathBg)}
        d={edgePath}
        style={style}
        strokeLinecap={'round'}
      />
      <path
        className={clsx('react-flow__edge-path', css.edgePath)}
        d={edgePath}
        style={style}
        strokeLinecap={'round'}
        {
          // strokeLinecap={isDotted ? 'butt' : 'round'}
          // strokeMiterlimit={10}
          // strokeLinejoin="bevel"
          ...(strokeDasharray ? { strokeDasharray } : {})
        }
        {...(edge.headArrow ? { markerEnd: marker } : {})}
        {...(edge.tailArrow ? { markerStart: marker } : {})}
      />
      <path
        className={clsx('react-flow__edge-interaction')}
        d={edgePath}
        fill="none"
        strokeOpacity={0}
        strokeWidth={interactionWidth ?? 10}
      />
      {
        /*
      {controlPoints.map((p, i) => (
        <circle
          className={styles.controlPoint}
          key={i}
          cx={p[0]}
          cy={p[1]}
          r={5}
        />
      ))} */
      }
      {data.label && (
        <>
          {
            /* <rect
            x={data.label.bbox.x}
            y={data.label.bbox.y}
            width={data.label.bbox.width + 2}
            height={data.label.bbox.height + 2}
            className={styles.edgeLabelBbox}
            rx={3}
          /> */
          }
          <EdgeLabelRenderer>
            <Box
              className={clsx(css.container, css.edgeLabel)}
              data-likec4-color={color}
              style={{
                top: labelY,
                left: labelX,
                maxWidth: data.label.bbox.width + 10,
                zIndex: ZIndexes.Edge
              }}
              mod={{
                'data-edge-hovered': isHovered
              }}
            >
              <Box className={css.edgeLabelBody}>
                {data.label.text}
              </Box>
              {/* <Text component="span" fz={rem(12)}></Text> */}
            </Box>
          </EdgeLabelRenderer>
        </>
      )}
    </g>
  )
}, isEqualReactSimple)
