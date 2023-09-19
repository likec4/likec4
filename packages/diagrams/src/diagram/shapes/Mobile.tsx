import { useSpring } from '@react-spring/konva'
import { AnimatedRect, Circle } from '../../konva'
import { NodeLabels } from './nodeLabels'
import type { NodeShapeProps } from './types'

export function MobileShape({ node, theme, springs, isHovered }: NodeShapeProps) {
  const colors = theme.colors[node.color]

  const { fill, stroke } = useSpring({
    to: {
      fill: colors.fill,
      stroke: colors.stroke
    }
  })

  // const [toolbarProps, toggleToolbar] = useNodeToolbarSpring()
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
        width={springs.width}
        height={springs.height}
        fill={stroke}
      />
      <Circle x={16} y={node.size.height / 2} radius={10} fill={colors.fill} listening={false} />
      <AnimatedRect
        cornerRadius={4}
        x={31}
        y={12}
        width={springs.width.to(w => w - 43)}
        height={springs.height.to(h => h - 24)}
        fill={fill}
        listening={false}
      />
      <NodeLabels node={node} theme={theme} offsetX={-6} />
      {/* <ExternalLink
              x={-2}
              y={30}
              fill={adjust(colors.fill, { s: -20, l: 3 })}
              fillIcon={colors.loContrast}
              {...toolbarProps}
            /> */}
    </>
  )
}
