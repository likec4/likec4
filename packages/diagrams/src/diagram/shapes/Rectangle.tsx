import {
  useSpring
} from '@react-spring/konva'
import { AnimatedGroup, AnimatedRect } from '../../konva'
import { NodeLabels } from './nodeLabels'
import type { NodeShapeProps } from './types'


export const RectangleShape = ({
  node,
  theme,
  springs,
  ...listeners
}: NodeShapeProps) => {
  const {
    color,
    labels
  } = node
  const { fill, shadow: shadowColor } = theme.colors[color]

  const rectProps = useSpring({
    to: {
      fill,
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
      <AnimatedRect
        cornerRadius={6}
        shadowBlur={12}
        shadowOpacity={0.3}
        shadowOffsetX={0}
        shadowOffsetY={8}
        width={springs.width}
        height={springs.height}
        {...rectProps}
      />
      <NodeLabels
        labels={labels}
        width={node.size.width}
        color={color}
        theme={theme}
      />
      {/* {hovered && (
        <Rect
          x={10}
          y={10}
          width={node.size.width - 20}
          height={20}
          visible={hovered}
          fill={darken(fill, 2)}
          onMouseEnter={e => {
            console.log('enter')
          }}
          onMouseLeave={e => {
            console.log('leave')
          }}
        />
      )} */}
    </AnimatedGroup>
  )
}
