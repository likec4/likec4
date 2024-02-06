import { invariant, type NonEmptyArray, type Point } from '@likec4/core'
import { Box, rem, Text } from '@mantine/core'
import type { EdgeProps } from '@xyflow/react'
import { EdgeLabelRenderer } from '@xyflow/react'
import clsx from 'clsx'
// import {
//   curveCatmullRom,
//   line as d3line
// } from 'd3-shape'
import { memo } from 'react'
import { equals, hasAtLeast } from 'remeda'
import useTilg from 'tilg'
// import { hoveredEdgeIdAtom } from '../state'
import { useLikeC4Editor, useLikeC4EditorSelector } from '../LikeC4ViewEditorApi'
import { useIsEdgeHovered } from '../state'
import type { RelationshipData } from '../types'
import styles from './RelationshipEdge.module.css'

// const distance = (a: XYPosition, b: XYPosition) => Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2))

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

// const RelationshipEdge = memo<EdgeProps<RelationshipData>>(
//   function RelationshipEdge({
//     sourceX,
//     sourceY,
//     targetX,
//     targetY,
//     data,
//     ...rest
//   }) {
//     // useLogger(`RelationshipEdge`, rest.id)
//     invariant(data, 'data is required')
//     // const [edgePath] = getStraightPath({
//     //   sourceX,
//     //   sourceY,
//     //   targetX,
//     //   targetY,
//     // });

//     // const path = data.

//     // const edgePath = [data.start, ...data.points, data.end].reduce(reduceToPath, '')
//     const edgepPath = [
//       {
//         x: sourceX,
//         y: sourceY,
//       },
//       // data.start,
//       ...data.points,
//       // data.end,
//       {
//         x: targetX,
//         y: targetY,
//       },
//     ].reduce(reduceToPath, '')
//     // const edgePath = line(data.points)
//     // invariant(edgePath, 'edgePath is required')

//     return <BaseEdge {...rest} path={edgePath} />
//   },
//   (a, b) =>
//     a.sourceX === b.sourceX
//     && b.sourceY === b.sourceY
//     && a.targetX === b.targetX
//     && a.targetY === b.targetY
//     && equals(a.data, b.data),
// )

// type RelationshipEdgeProps = SetRequired<EdgeProps<RelationshipData>, 'data'>

function bezierPath(bezierSpline: NonEmptyArray<Point>) {
  // eslint-disable-next-line prefer-const
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

// const curvePoly = d3line<Point>()
// const curveBez = d3line<Point>().curve(curveCatmullRom)

// const RelationshipEdgeMemo = memo<EdgeProps<RelationshipData>>(
export default function RelationshipEdge(props: EdgeProps<RelationshipData>) {
  useTilg()
  const {
    id,
    data,
    markerEnd,
    style,
    interactionWidth
  } = props
  invariant(data, 'data is required')
  let edgePath = bezierPath(data.points)
  if (data.headPoint) {
    edgePath = edgePath + ` L ${data.headPoint[0]},${data.headPoint[1]}`
  }
  if (data.tailPoint) {
    edgePath = `M ${data.tailPoint[0]},${data.tailPoint[1]} L ${data.points[0][0]},${data.points[0][1]}` + edgePath
  }
  const isHovered = useIsEdgeHovered(id)
  console.log(`isHovered: ${id}`, isHovered)

  return (
    <>
      <path
        className={clsx('react-flow__edge-path', styles.edgePath)}
        d={edgePath}
        fill="none"
        markerEnd={markerEnd}
        style={style}
        data-edge-hovered={isHovered}
        data-likec4-color={data.color ?? 'gray'}
      />
      <path
        id={id}
        className={clsx('react-flow__edge-interaction')}
        d={edgePath}
        fill="none"
        strokeOpacity={0}
        strokeWidth={interactionWidth ?? 10}
      />
      {data.label && (
        <EdgeLabelRenderer>
          <Box
            className={styles.edgeLabel}
            data-likec4-color={data.color ?? 'gray'}
            data-edge-hovered={isHovered}
            style={{
              top: data.label.bbox.y,
              left: data.label.bbox.x,
              width: data.label.bbox.width,
              zIndex: 2
            }}
          >
            <Text component="div" ta={'center'} fz={rem(12)}>{data.label.text}</Text>
          </Box>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
//   (a, b) =>
//     a.id === b.id
//     && equals(a.data, b.data),
// )

// export default RelationshipEdgeMemo
