import { useShadowSprings } from '../springs'
import { AnimatedEllipse, AnimatedPath } from '../../konva'
import { NodeLabels } from './NodeLabel'
import type { NodeShapeProps } from './types'
import { useSpring } from '@react-spring/konva'

function queueSVGPath(width: number, height: number, tilt = 0.2) {
  const diameter = height
  const radius = Math.round(diameter / 2)
  // const tiltAdjustedHeight = height * Math.cos((tilt * Math.PI) / 2)
  const ry = radius
  const rx = Math.round((diameter / 2) * tilt)
  const tiltAdjustedWidth = width - 2 * rx

  const path = `  M ${rx},0
        a ${rx},${ry} 0,0,0 0 ${diameter}
        l ${tiltAdjustedWidth},0
        a ${rx},${ry} 0,0,0 0 ${-diameter}
        `
    .replace(/\s+/g, ' ')
    .trim()
  return {
    path,
    ry,
    rx
  }
}

export function QueueShape({ node, theme, springs, isHovered }: NodeShapeProps) {
  const {
    size: { width, height }
  } = node

  const { path, rx, ry } = queueSVGPath(width, height)

  const props = useSpring({
    to: {
      x: width - rx,
      y: ry,
      rx,
      ry
    }
  })

  return (
    <>
      <AnimatedPath
        {...useShadowSprings(isHovered, theme, springs)}
        data={path}
        perfectDrawEnabled={false}
        fill={springs.fill}
      />
      <AnimatedEllipse
        x={props.x}
        y={props.y}
        radiusX={props.rx}
        radiusY={props.ry}
        fill={springs.stroke}
      />
      <NodeLabels node={node} maxWidth={width - rx * 2} theme={theme} />
    </>
  )
}
