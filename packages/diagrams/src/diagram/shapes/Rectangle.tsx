import { useSpring } from '@react-spring/konva'
import { AnimatedGroup, AnimatedRect } from '../../konva'
import { NodeLabels } from './nodeLabels'
import type { NodeShapeProps } from './types'

export function RectangleShape({ node, theme, springs, isHovered }: NodeShapeProps) {
  const colors = theme.colors[node.color]

  const rectProps = useSpring({
    to: {
      fill: colors.fill
    }
  })

  // const [toolbarProps, toggleToolbar] = useNodeToolbarSpring()
  return (
    <>
      <AnimatedRect
        width={springs.width}
        height={springs.height}
        cornerRadius={6}
        shadowBlur={isHovered ? 20 : 16}
        shadowOpacity={isHovered ? 0.35 : 0.25}
        shadowOffsetX={0}
        shadowOffsetY={isHovered ? 10 : 8}
        shadowColor={theme.shadow}
        shadowEnabled={springs.opacity.to(v => v > 0.9)}
        perfectDrawEnabled={false}
        // strokeEnabled={isHovered === true}
        // shadowForStrokeEnabled={false}
        // stroke={'#F8F3D4'}
        // strokeScaleEnabled={false}
        // strokeWidth={2}
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
    </>
  )
}
