import { useSpring } from '@react-spring/konva'
import { useMemo } from 'react'
import { AnimatedGroup, AnimatedPath } from '../../konva'
import { cylinderSVGPath } from './Cylinder'
import { NodeLabels } from './nodeLabels'
import type { NodeShapeProps } from './types'

export const QueueShape = ({
  node,
  theme,
  springs,
  ...listeners
}: NodeShapeProps) => {
  const {
    size: { width, height },
    color,
    labels
  } = node
  const { fill, stroke, shadow: shadowColor } = theme.colors[color]

  const path = useMemo(() => cylinderSVGPath(height, width, 0.1), [width, height])
  const rx = Math.round(2 * 0.1 * (height / 2) * 1000) / 1000

  const queueProps = useSpring({
    to: {
      fill,
      stroke,
      shadowColor
    }
  })

  return (
    // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error, @typescript-eslint/ban-ts-comment
    // @ts-ignore
    <AnimatedGroup
      {...springs}
      {...listeners}
    >
      <AnimatedPath
        shadowBlur={12}
        shadowOpacity={0.3}
        shadowOffsetX={0}
        shadowOffsetY={8}
        rotation={90}
        data={path}
        width={springs.height}
        height={springs.width}
        x={springs.offsetX}
        y={springs.offsetY}
        offsetX={springs.offsetY}
        offsetY={springs.offsetX}
        {...queueProps}
      />
      <NodeLabels
        labels={labels}
        width={width - rx}
        color={color}
        theme={theme}
      />
    </AnimatedGroup>
  )
}
