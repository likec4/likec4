import { useSpring } from '@react-spring/konva'
import { AnimatedGroup, AnimatedRect, Circle } from '../../konva'
import { NodeLabels } from './nodeLabels'
import type { NodeShapeProps } from './types'


export const BrowserShape = ({
  node,
  theme,
  springs,
  ...listeners
}: NodeShapeProps) => {

    const colors = theme.colors[node.color]

    const {
      fill,
      stroke
    } = useSpring({
      to: {
        fill: colors.fill,
        stroke: colors.stroke
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
        shadowBlur={16}
        shadowOpacity={0.25}
        shadowOffsetX={0}
        shadowOffsetY={8}
        shadowEnabled={!!node.parent}
        width={springs.width}
        height={springs.height}
        fill={stroke}
        shadowColor={colors.shadow}
      />
      <Circle
        x={16}
        y={15}
        radius={7}
        fill={colors.fill}
      />
      <Circle
        x={36}
        y={15}
        radius={7}
        fill={colors.fill}
      />
      <Circle
        x={56}
        y={15}
        radius={7}
        fill={colors.fill}
      />
      <AnimatedRect
        cornerRadius={5}
        x={70}
        y={7}
        width={springs.width.to(w => w - 80)}
        height={16}
        fill={fill}
      />
      <AnimatedRect
        cornerRadius={5}
        x={9}
        y={31}
        width={springs.width.to(w => w - 18)}
        height={springs.height.to(h => h - 40)}
        fill={fill}
      />
      <NodeLabels
        labels={node.labels}
        width={node.size.width}
        color={node.color}
        theme={theme}
        offsetY={-8}
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
