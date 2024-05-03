import { isEqualSimple } from '@react-hookz/deep-equal'
import { memo } from 'react'
import { Circle, Group, Line } from '../../konva'

type ZoomInIconProps = {
  fill?: string
  opacity?: number
  size?: number
  x: number
  y: number
}

export const ZoomInIcon = memo(({ fill = '#BABABA', opacity = 1, size = 20, x, y }: ZoomInIconProps) => {
  const originalSize = 24
  const scale = size / originalSize

  const offsetIcon = originalSize / 2

  return (
    <Group
      x={x}
      y={y}
      offsetX={offsetIcon}
      offsetY={offsetIcon}
      scaleX={scale}
      scaleY={scale}
      width={originalSize}
      height={originalSize}
      opacity={opacity}
      globalCompositeOperation={'luminosity'}
    >
      <Circle
        x={11}
        y={11}
        radius={8}
        stroke={fill}
        strokeWidth={2}
        perfectDrawEnabled={false}
        listening={false}
      />
      <Line
        points={[22, 22, 16.65, 16.65]}
        stroke={fill}
        strokeWidth={2}
        perfectDrawEnabled={false}
        listening={false}
        lineCap="round"
        lineJoin="round"
      />
      <Line
        points={[11, 8, 11, 14]}
        stroke={fill}
        strokeWidth={2}
        perfectDrawEnabled={false}
        listening={false}
        lineCap="round"
        lineJoin="round"
      />
      <Line
        points={[8, 11, 14, 11]}
        stroke={fill}
        strokeWidth={2}
        perfectDrawEnabled={false}
        listening={false}
        lineCap="round"
        lineJoin="round"
      />
    </Group>
  )
}, isEqualSimple)
