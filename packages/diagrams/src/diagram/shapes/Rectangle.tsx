import { useSpring } from '@react-spring/konva'
import { AnimatedRect } from '../../konva'
import { NodeLabels } from './nodeLabels'
import type { NodeShapeProps } from './types'

export function RectangleShape({ node, theme, springs, isHovered }: NodeShapeProps) {
  const colors = theme.colors[node.color]

  const rectProps = useSpring({
    to: {
      ...node.size,
      fill: colors.fill
    }
  })
  return (
    <>
      <AnimatedRect
        cornerRadius={6}
        shadowBlur={isHovered ? 20 : 16}
        shadowOpacity={isHovered ? 0.35 : 0.25}
        shadowOffsetX={0}
        shadowOffsetY={isHovered ? 10 : 8}
        shadowColor={theme.shadow}
        shadowEnabled={springs.opacity.to(v => v > 0.9)}
        perfectDrawEnabled={false}
        strokeEnabled={false}
        // strokeEnabled={isHovered === true}
        // shadowForStrokeEnabled={false}
        // stroke={'#F8F3D4'}
        // strokeScaleEnabled={false}
        // strokeWidth={2}
        {...rectProps}
      />
      <NodeLabels node={node} theme={theme} />
      {/* <ExternalLink
              x={-2}
              y={30}
              fill={scale(colors.fill, { s: -10, l: 3 })}
              fillIcon={colors.loContrast}
              {...toolbarProps}
            /> */}
    </>
  )
}
