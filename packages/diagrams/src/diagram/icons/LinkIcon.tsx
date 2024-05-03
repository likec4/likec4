import { isEqualSimple } from '@react-hookz/deep-equal'
import { memo } from 'react'
import { Group, Path } from '../../konva'

type LinkIconProps = {
  color?: string
  opacity?: number
  size?: number
  x: number
  y: number
}

export const LinkIcon = memo<LinkIconProps>(({ color = '#BABABA', opacity = 1, size = 24, x, y }) => {
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
      opacity={opacity}
      globalCompositeOperation={'luminosity'}
    >
      <Path
        data="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
        stroke={color}
        strokeWidth={2}
        lineCap="round"
        lineJoin="round"
        listening={false}
        perfectDrawEnabled={false}
      />
      <Path
        data="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
        stroke={color}
        strokeWidth={2}
        lineCap="round"
        lineJoin="round"
        listening={false}
        perfectDrawEnabled={false}
      />
    </Group>
  )
}, isEqualSimple)
