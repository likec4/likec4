import { invariant, type NonEmptyArray, type Point } from '@likec4/core'
import { Box, rem, Text } from '@mantine/core'
import type { EdgeProps } from '@xyflow/react'
import { EdgeLabelRenderer } from '@xyflow/react'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { memo } from 'react-tracked'
import { hasAtLeast } from 'remeda'
import useTilg from 'tilg'
import { ZIndexes } from '../../const'
import { useSelectDiagramState } from '../../state'
import type { RelationshipData } from '../types'
import styles from './RelationshipEdge.module.css'

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
  interactionWidth
}) {
  invariant(data, 'data is required')
  const {
    edge,
    controlPoints
  } = data
  const edgePath = bezierPath(edge.points)
  const color = edge.color ?? 'gray'
  const isHovered = useSelectDiagramState(state => state.hoveredEdgeId === id)

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

  return (
    <g className={styles.container} data-likec4-color={color} data-edge-hovered={isHovered}>
      <g className={clsx(styles.fillStrokeCtx)}>
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
        className={clsx('react-flow__edge-path', styles.edgePath)}
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
              className={styles.edgeLabel}
              data-likec4-color={color}
              data-edge-hovered={isHovered}
              style={{
                top: data.label.bbox.y,
                left: data.label.bbox.x,
                width: data.label.bbox.width + 5,
                // maxWidth: data.label.bbox.width + 25,
                zIndex: ZIndexes.Edge
              }}
            >
              <Box
                className={styles.edgeLabelBody}>
                <span>{data.label.text}</span>
              </Box>
              {/* <Text component="span" fz={rem(12)}></Text> */}
            </Box>
          </EdgeLabelRenderer>
        </>
      )}
    </g>
  )
})
