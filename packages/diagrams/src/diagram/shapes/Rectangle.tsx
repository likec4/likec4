import {
  useSpring
} from '@react-spring/konva'
import { AnimatedGroup, AnimatedRect } from '../../konva'
import { NodeLabels } from './nodeLabels'
import type { NodeShapeProps } from './types'

export function RectangleShape({
  id,
  node,
  theme,
  springs,
  ...listeners
}: NodeShapeProps) {
  const {
    color, labels
  } = node
  const colors = theme.colors[color]

  const rectProps = useSpring({
    to: {
      fill: colors.fill,
      shadowColor: colors.shadow
    }
  })

  // const [toolbarProps, toggleToolbar] = useNodeToolbarSpring()
  return (
    // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error, @typescript-eslint/ban-ts-comment
    // @ts-ignore
    <AnimatedGroup
      id={id}
      x={springs.x}
      y={springs.y}
      offsetX={springs.offsetX}
      offsetY={springs.offsetY}
      opacity={springs.opacity}
      scaleX={springs.scaleX}
      scaleY={springs.scaleY}
      {...listeners}
    >
      <AnimatedRect
        width={springs.width}
        height={springs.height}
        cornerRadius={6}
        shadowBlur={16}
        shadowOpacity={0.25}
        shadowOffsetX={0}
        shadowOffsetY={8}
        shadowEnabled={node.parent ? springs.opacity.to(v => v > 0.9) : false}
        perfectDrawEnabled={false}
        strokeEnabled={false}
        // shadowForStrokeEnabled={false}
        // stroke={rectProps.fill}
        // strokeScaleEnabled={false}
        // strokeWidth={1}
        // hitStrokeWidth={25}
        {...rectProps} />
      <NodeLabels
        labels={labels}
        width={node.size.width}
        color={color}
        theme={theme} />
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
