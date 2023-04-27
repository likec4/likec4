import { darken } from 'khroma'
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

    // const { fill } = useSpring({
    //   to: {
    //     fill: colors.fill,
    //   },
    //   immediate: !animate
    // })

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
        fill={darken(colors.fill, 9)}
        shadowColor={colors.shadow}
      />
      <Circle
        x={16}
        y={15}
        radius={7}
        fill={darken(colors.fill, 2)}/>
      <Circle
        x={36}
        y={15}
        radius={7}
        fill={darken(colors.fill, 2)}/>
      <Circle
        x={56}
        y={15}
        radius={7}
        fill={darken(colors.fill, 2)}/>
      <AnimatedRect
        cornerRadius={5}
        x={70}
        y={7}
        width={springs.width.to(w => w - 80)}
        height={16}
        fill={darken(colors.fill, 1)}

      />
      <AnimatedRect
        cornerRadius={5}
        x={9}
        y={31}
        width={springs.width.to(w => w - 18)}
        height={springs.height.to(h => h - 40)}
        fill={colors.fill}
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
