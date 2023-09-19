import { useSpring } from '@react-spring/konva'
import { AnimatedPath } from '../../konva'
import { cylinderSVGPath } from './Cylinder'
import { NodeLabels } from './nodeLabels'
import type { NodeShapeProps } from './types'

export function QueueShape({ node, theme, springs }: NodeShapeProps) {
  const {
    size: { width, height }
  } = node
  const { fill, stroke } = theme.colors[node.color]

  const { path, ry } = cylinderSVGPath(height, width, 0.1)

  const queueProps = useSpring({
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
        shadowColor={theme.shadow}
        rotation={90}
        data={path}
        width={springs.height}
        height={springs.width}
        x={springs.offsetX}
        y={springs.offsetY}
        offsetX={springs.offsetY}
        offsetY={springs.offsetX}
        shadowEnabled={springs.opacity.to(v => v > 0.9)}
        perfectDrawEnabled={false}
        shadowForStrokeEnabled={false}
        strokeWidth={2}
        hitStrokeWidth={8}
        listening={false}
        {...queueProps}
      />
      <NodeLabels node={node} maxWidth={width - ry * 2} theme={theme} />
    </>
  )
}
