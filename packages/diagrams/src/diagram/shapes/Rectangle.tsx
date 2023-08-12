import { useSpring } from '@react-spring/konva'
import { AnimatedGroup, AnimatedRect } from '../../konva'
import { NodeLabels } from './nodeLabels'
import type { NodeShapeProps } from './types'

export function RectangleShape({ id, node, theme, springs, ...listeners }: NodeShapeProps) {
  const colors = theme.colors[node.color]

  const rectProps = useSpring({
    to: {
      fill: colors.fill
    }
  })

  // const [toolbarProps, toggleToolbar] = useNodeToolbarSpring()
  return (
    <AnimatedGroup id={id} {...springs} {...listeners}>
      <AnimatedRect
        width={springs.width}
        height={springs.height}
        cornerRadius={6}
        shadowBlur={16}
        shadowOpacity={0.25}
        shadowOffsetX={0}
        shadowOffsetY={8}
        shadowColor={theme.shadow}
        shadowEnabled={springs.opacity.to(v => v > 0.9)}
        perfectDrawEnabled={false}
        strokeEnabled={false}
        // shadowForStrokeEnabled={false}
        // stroke={rectProps.fill}
        // strokeScaleEnabled={false}
        // strokeWidth={1}
        // hitStrokeWidth={25}
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
    </AnimatedGroup>
  )
}
