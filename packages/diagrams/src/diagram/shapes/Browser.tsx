import { useSpring } from '@react-spring/konva'
import { AnimatedRect, Circle } from '../../konva'
import { NodeLabels } from './nodeLabels'
import type { NodeShapeProps } from './types'

export function BrowserShape({ node, theme, springs }: NodeShapeProps) {
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
        shadowBlur={16}
        shadowOpacity={0.25}
        shadowOffsetX={0}
        shadowOffsetY={8}
        shadowEnabled={springs.opacity.to(v => v > 0.9)}
        width={springs.width}
        height={springs.height}
        fill={stroke}
        shadowColor={theme.shadow}
      />
      <Circle x={16} y={15} radius={7} fill={colors.fill} listening={false} />
      <Circle x={36} y={15} radius={7} fill={colors.fill} listening={false} />
      <Circle x={56} y={15} radius={7} fill={colors.fill} listening={false} />
      <AnimatedRect
        cornerRadius={5}
        x={70}
        y={7}
        width={springs.width.to(w => w - 80)}
        height={16}
        fill={fill}
        listening={false}
      />
      <AnimatedRect
        cornerRadius={5}
        x={9}
        y={31}
        width={springs.width.to(w => w - 18)}
        height={springs.height.to(h => h - 40)}
        fill={fill}
        listening={false}
      />
      <NodeLabels node={node} theme={theme} offsetY={-8} />
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
