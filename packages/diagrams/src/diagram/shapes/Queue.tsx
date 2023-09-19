import { useSpring } from '@react-spring/konva'
import { AnimatedEllipse, AnimatedPath } from '../../konva'
import { NodeLabels } from './nodeLabels'
import type { NodeShapeProps } from './types'

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
  const { fill, stroke } = theme.colors[node.color]

  const { path, rx, ry } = queueSVGPath(width, height)

  const props = useSpring({
    to: {
      x: width - rx,
      y: ry,
      rx,
      ry,
      fill,
      stroke
    }
  })

  return (
    <>
      <AnimatedPath
        shadowBlur={isHovered ? 20 : 16}
        shadowOpacity={isHovered ? 0.35 : 0.25}
        shadowOffsetX={0}
        shadowOffsetY={isHovered ? 10 : 8}
        shadowColor={theme.shadow}
        shadowEnabled={springs.opacity.to(v => v > 0.9)}
        data={path}
        perfectDrawEnabled={false}
        fill={props.fill}
      />
      <AnimatedEllipse x={props.x} y={props.y} radiusX={props.rx} radiusY={props.ry} fill={props.stroke} />
      <NodeLabels node={node} maxWidth={width - rx * 2} theme={theme} />
    </>
  )
}
