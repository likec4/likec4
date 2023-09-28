import { useSpring } from '@react-spring/konva'
import { AnimatedEllipse, AnimatedPath } from '../../konva'
import { NodeLabels } from './NodeLabel'
import { useShadowSprings } from '../springs'
import type { NodeShapeProps } from './types'

function cylinderSVGPath(diameter: number, height: number, tilt = 0.07) {
  const radius = Math.round(diameter / 2)
  // const tiltAdjustedHeight = height * Math.cos((tilt * Math.PI) / 2)
  const rx = radius
  const ry = Math.round(tilt * radius)
  const tiltAdjustedHeight = height - 2 * ry

  const path = `  M ${diameter},${ry}
        a ${rx},${ry} 0,0,0 ${-diameter} 0
        l 0,${tiltAdjustedHeight}
        a ${rx},${ry} 0,0,0 ${diameter} 0
        l 0,${-tiltAdjustedHeight}
        `
    .replace(/\s+/g, ' ')
    .trim()
  return {
    path,
    ry,
    rx
  }
}

export function CylinderShape({ node, theme, springs, isHovered }: NodeShapeProps) {
  const {
    size: { width, height }
  } = node

  const { path, rx, ry } = cylinderSVGPath(width, height)

  const cylinder = useSpring({
    to: {
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
        shadowForStrokeEnabled={false}
        fill={springs.fill}
      />
      <AnimatedEllipse
        x={cylinder.rx}
        y={cylinder.ry}
        radiusX={cylinder.rx}
        radiusY={cylinder.ry}
        fill={springs.stroke}
      />
      <NodeLabels node={node} offsetY={3 - ry * (node.icon ? 1.8 : 0.8)} theme={theme} />
    </>
  )
}
