import type { DiagramNode } from '@likec4/core/types'
import { animated, useSpring } from '@react-spring/konva'
import { useMemo } from 'react'
import type { DiagramTheme } from '../types'
import { useNodeEvents } from './nodeEvents'
import { NodeLabels as NodeTitle } from './nodeLabels'
import type { InterporatedNodeSprings, NodeSpringsCtrl } from './nodeSprings'

export function cylinderSVGPath(diameter: number, height: number, tilt = 0.07) {
  const radius = Math.round(diameter / 2)
  // const tiltAdjustedHeight = height * Math.cos((tilt * Math.PI) / 2)
  const rx = radius
  const ry = Math.round(tilt * radius * 1000) / 1000
  const tiltAdjustedHeight = height - 2 * ry

  const d = `   M 0,${ry}
        a ${rx},${ry} 0,0,0 ${diameter} 0
        a ${rx},${ry} 0,0,0 ${-diameter} 0
        l 0,${tiltAdjustedHeight}
        a ${rx},${ry} 0,0,0 ${diameter} 0
        l 0,${-tiltAdjustedHeight}
        `
    .replace(/\s+/g, ' ')
    .trim()
  return d
}

export interface CylinderShapeProps {
  animate?: boolean
  node: DiagramNode
  theme: DiagramTheme
  springs: InterporatedNodeSprings
  ctrl: NodeSpringsCtrl
  onNodeClick?: ((node: DiagramNode) => void) | undefined
}

export const CylinderShape = ({
  animate = true,
  node,
  theme,
  springs,
  ctrl,
  onNodeClick
}: CylinderShapeProps) => {
  const {
    id,
    size: { width, height },
    color,
    labels
  } = node
  const { fill, stroke, shadow: shadowColor } = theme.colors[color]

  const path = useMemo(() => cylinderSVGPath(width, height), [width, height])
  const ry = Math.round(0.05 * (width / 2) * 1000) / 1000

  const cylinderProps = useSpring({
    to: {
      fill,
      stroke,
      shadowColor
    },
    immediate: !animate
  })

  return (
    // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error, @typescript-eslint/ban-ts-comment
    // @ts-ignore
    <animated.Group
      {...springs}
      {...useNodeEvents({
        node,
        ctrl,
        onNodeClick
      })}
      >
      <animated.Path
        shadowBlur={12}
        shadowOpacity={0.3}
        shadowOffsetX={0}
        shadowOffsetY={8}
        data={path}
        width={springs.width}
        height={springs.height}
        {...cylinderProps}
      />
      <NodeTitle
        labels={labels}
        // offsetY={-ry}
        width={width}
        color={color}
        theme={theme}
      />
    </animated.Group>
  )
}
