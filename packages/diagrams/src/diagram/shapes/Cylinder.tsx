import { useSpring } from '@react-spring/konva'
import { useMemo } from 'react'
import { AnimatedGroup, AnimatedPath } from '../../konva'
import { NodeLabels as NodeTitle } from './nodeLabels'
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

export function CylinderShape({
  id,
  node,
  theme,
  springs,
  ...listeners
}: NodeShapeProps): JSX.Element {
  const {
    size: { width, height },
    color
  } = node
  const { fill, stroke } = theme.colors[color]

  const { path, ry } = useMemo(() => cylinderSVGPath(width, height), [width, height])
  // const ry = Math.round(0.05 * (width / 2) * 1000) / 1000
  const cylinderProps = useSpring({
    to: {
      fill,
      stroke
    }
  })

  return (
    // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error, @typescript-eslint/ban-ts-comment
    // @ts-ignore
    <AnimatedGroup id={id} {...springs} {...listeners}>
      <AnimatedPath
        shadowBlur={16}
        shadowOpacity={0.25}
        shadowOffsetX={0}
        shadowOffsetY={8}
        shadowEnabled={node.parent ? springs.opacity.to(v => v > 0.9) : false}
        shadowColor={theme.shadow}
        data={path}
        width={springs.width}
        height={springs.height}
        perfectDrawEnabled={false}
        shadowForStrokeEnabled={false}
        strokeWidth={2}
        hitStrokeWidth={8}
        {...cylinderProps}
      />
      <NodeTitle node={node} offsetY={-2 * ry + 4} theme={theme} />
    </AnimatedGroup>
  )
}
