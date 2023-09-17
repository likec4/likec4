import { useSpring } from '@react-spring/konva'
import { AnimatedPath } from '../../konva'
import { NodeLabels } from './nodeLabels'
import type { NodeShapeProps } from './types'

export function cylinderSVGPath(diameter: number, height: number, tilt = 0.07) {
  const radius = Math.round(diameter / 2)
  // const tiltAdjustedHeight = height * Math.cos((tilt * Math.PI) / 2)
  const rx = radius
  const ry = Math.round(tilt * radius * 1000) / 1000
  const tiltAdjustedHeight = height - 2 * ry

  const path = `   M 0,${ry}
        a ${rx},${ry} 0,0,0 ${diameter} 0
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

export function CylinderShape({ node, theme, springs }: NodeShapeProps) {
  const {
    size: { width, height },
    color
  } = node
  const { fill, stroke } = theme.colors[color]

  const { path, ry } = cylinderSVGPath(width, height)

  const cylinderProps = useSpring({
    to: {
      fill,
      stroke
    }
  })

  return (
    <>
      <AnimatedPath
        shadowBlur={16}
        shadowOpacity={0.25}
        shadowOffsetX={0}
        shadowOffsetY={8}
        shadowEnabled={springs.opacity.to(v => v > 0.9)}
        shadowColor={theme.shadow}
        data={path}
        width={springs.width}
        height={springs.height}
        perfectDrawEnabled={false}
        shadowForStrokeEnabled={false}
        strokeWidth={2}
        {...cylinderProps}
      />
      <NodeLabels node={node} offsetY={3 - ry * (node.icon ? 1.8 : 0.8)} theme={theme} />
    </>
  )
}
