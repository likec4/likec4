import { hasAtLeast, invariant, type NonEmptyArray, type Point } from '@likec4/core'
import { Box, Paper } from '@mantine/core'
import { BaseEdge, type EdgeProps, Handle, NodeToolbar, Position } from '@xyflow/react'
import clsx from 'clsx'
import { memo } from 'react'
import * as css from './Edges.css'
import type { FileXYNode, FolderXYNode, OverviewXYEdge, ViewXYNode } from './types'

function edgePath(points: NonEmptyArray<Point>) {
  // let [start, ...points] = points
  // invariant(start, 'start should be defined')
  // let path = `M ${start[0]},${start[1]}`

  // while (hasAtLeast(points, 3)) {
  //   const [cp1, cp2, end, ...rest] = points
  //   path = path + ` C ${cp1[0]},${cp1[1]} ${cp2[0]},${cp2[1]} ${end[0]},${end[1]}`
  //   points = rest
  // }
  // invariant(points.length === 0, 'all points should be consumed')

  // return path
  return points.reduce((acc, [x, y], i) => {
    return acc + `${i === 0 ? 'M' : ' L'} ${x},${y}`
  }, '')
}

export function LinkEdge({
  id,
  data,
  ...props
}: EdgeProps<OverviewXYEdge>) {
  if (!data) {
    return null
  }
  const path = edgePath(data.points)
  return (
    <BaseEdge
      id={id}
      path={path}
      {...props}
    />
    // <g>
    //   <path
    //     className={clsx('react-flow__edge-interaction')}
    //     d={edgePath}
    //     fill="none"
    //     stroke={'transparent'}
    //     strokeWidth={interactionWidth}
    //   />
    //   <path
    //     className={clsx('react-flow__edge-path')}
    //     d={edgePath}
    //     style={style}
    //     strokeLinecap={'round'}
    //   />
    // </g>
  )
}
