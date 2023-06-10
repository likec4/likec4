import { useSpring } from '@react-spring/konva'
import { useMemo } from 'react'
import { AnimatedGroup, AnimatedPath } from '../../konva'
import { cylinderSVGPath } from './Cylinder'
import { NodeLabels } from './nodeLabels'
import type { NodeShapeProps } from './types'
import React from 'react'

export function QueueShape({
  id,
  node,
  theme,
  springs,
  ...listeners
}: NodeShapeProps): JSX.Element {
  const {
    size: { width, height }, color, labels
  } = node
  const { fill, stroke } = theme.colors[color]

  const path = useMemo(() => cylinderSVGPath(height, width, 0.1), [width, height])
  const rx = Math.round(2 * 0.1 * (height / 2) * 1000) / 1000

  const queueProps = useSpring({
    to: {
      fill,
      stroke
    }
  })

  return (
    // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error, @typescript-eslint/ban-ts-comment
    // @ts-ignore
    <AnimatedGroup
      id={id}
      {...springs}
      {...listeners}
    >
      <AnimatedPath
        shadowBlur={16}
        shadowOpacity={0.25}
        shadowOffsetX={0}
        shadowOffsetY={8}
        shadowColor={theme.shadow}
        rotation={90}
        data={path}
        width={springs.height}
        height={springs.width}
        x={springs.offsetX}
        y={springs.offsetY}
        offsetX={springs.offsetY}
        offsetY={springs.offsetX}
        shadowEnabled={node.parent ? springs.opacity.to(v => v > 0.9) : false}
        perfectDrawEnabled={false}
        shadowForStrokeEnabled={false}
        strokeWidth={2}
        hitStrokeWidth={8}
        {...queueProps} />
      <NodeLabels
        labels={labels}
        width={width - rx}
        color={color}
        theme={theme} />
    </AnimatedGroup>
  )
}
