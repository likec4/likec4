import { invariant, type NonEmptyArray, type Point } from '@likec4/core'
import { Box } from '@mantine/core'
import { isEqualReactSimple } from '@react-hookz/deep-equal'
import type { EdgeProps } from '@xyflow/react'
import { EdgeLabelRenderer, getBezierPath, useStore } from '@xyflow/react'
import clsx from 'clsx'
import { deepEqual, shallowEqual } from 'fast-equals'
import { useCallback } from 'react'
import { memo } from 'react-tracked'
import { hasAtLeast } from 'remeda'
import { useDiagramStateSelector } from '../../state'
import { ZIndexes } from '../const'
import { useXYFlow } from '../hooks'
import { type XYFlowEdge, XYFlowNode } from '../types'
import { container, cssEdgePath, edgeLabel, edgeLabelBody, edgePathBg, fillStrokeCtx } from './edges.css'
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

export const RelationshipEdge = /* @__PURE__ */ memo<EdgeProps<XYFlowEdge>>(function RelationshipEdgeR({
  id,
  data,
  selected,
  markerEnd,
  style,
  source,
  target,
  interactionWidth
}) {
  const xyflow = useXYFlow()
  const isModified = useStore(
    useCallback(s => {
      const sourceNode = s.nodeLookup.get(source)!
      const targetNode = s.nodeLookup.get(target)!
      invariant(XYFlowNode.is(sourceNode))
      invariant(XYFlowNode.is(targetNode))
      const isSourceModified = !!sourceNode.computed?.positionAbsolute
        && !shallowEqual(sourceNode.computed.positionAbsolute, {
          x: sourceNode.data.element.position[0],
          y: sourceNode.data.element.position[1]
        })
      if (isSourceModified) {
        return true
      }
      return !!targetNode.computed?.positionAbsolute
        && !shallowEqual(targetNode.computed.positionAbsolute, {
          x: targetNode.data.element.position[0],
          y: targetNode.data.element.position[1]
        })
    }, [source, target]),
    deepEqual
  )

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
    strokeDasharray = '1,8'
  } else if (isDashed) {
    strokeDasharray = '8,10'
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

  //   useTilg()`
  //   ${id}
  //   path=${edgePath}
  //   isModified=${isModified}
  // `

  return (
    <g className={clsx(container)} data-likec4-color={color} data-edge-hovered={isHovered}>
      <g className={clsx(fillStrokeCtx)}>
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
      {/* {!isDotted && ( */}
      <path
        className={clsx('react-flow__edge-path', edgePathBg)}
        d={edgePath}
        style={style}
        strokeLinecap={'round'}
      />
      {/* )} */}
      <path
        className={clsx('react-flow__edge-path', cssEdgePath)}
        d={edgePath}
        // animate={isHovered && {
        //   strokeDashoffset: [36, 0],
        //   transition: {
        //     repeat: Infinity,
        //     type: 'tween',
        //     ease: 'linear',
        //     duration: 0.9
        //   }
        // }}
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
            /* <EdgeText
            x={labelX}
            y={labelY}
            label={data.label.text}
            labelStyle={{
              maxWidth: 50,
              whiteSpace: 'pre-wrap',
            }}
            labelBgBorderRadius={3}
            labelBgPadding={[4, 3]}
          /> */
          }

          <EdgeLabelRenderer>
            <Box
              className={clsx(container, edgeLabel)}
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
              <Box className={edgeLabelBody}>
                {data.label.text}
              </Box>
            </Box>
          </EdgeLabelRenderer>
        </>
      )}
    </g>
  )
}, isEqualReactSimple)
