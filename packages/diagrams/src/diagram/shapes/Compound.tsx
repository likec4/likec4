import type { DiagramNode } from '@likec4/core/types'
import { useMemo } from 'react'
import { AnimatedGroup, AnimatedRect, Text } from '../../konva'

import { scale } from 'khroma'
import type { DiagramTheme } from '../types'
import type { InterporatedNodeSprings, OnNodeClick, OnPointerEvent } from './types'
import { mouseDefault, mousePointer } from './utils'

interface CompoundProps {
  animate?: boolean
  node: DiagramNode
  theme: DiagramTheme
  springs: InterporatedNodeSprings
  onNodeClick?: OnNodeClick | undefined
}

export const CompoundShape = ({
  node,
  theme,
  springs,
  onNodeClick
}: CompoundProps) => {
  const { color, labels } = node
  const colors = theme.colors[color]

  const fill = scale(colors.fill, {
    l: node.parent ? -45 : -55,
    s: node.parent ? -30 : -35
  })

  const loContrast = scale(colors.loContrast, {
    s: -25,
    l: -15
  })


  const listeners = onNodeClick ? {
    onMouseEnter: (e: OnPointerEvent) => {
      mousePointer(e)
    },
    onMouseLeave: (e: OnPointerEvent) => {
      mouseDefault(e)
    },
    onPointerClick: (evt: OnPointerEvent) => {
      evt.cancelBubble = true
      onNodeClick(node, evt)
    }
  } : {}
  // const {
  //   x, y, offsetX, offsetY, scaleX, scaleY, opacity
  // } = useMemo(() => {
  //   console.log(`CompoundShape useMemo ${id}}` )
  //   return nodeSprings(springs)
  // }, [springs])

  // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error, @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return <AnimatedGroup {...springs}>
    <AnimatedRect
      // {...rectProps}
      cornerRadius={4}
      shadowColor={colors.shadow}
      shadowBlur={12}
      shadowOpacity={0.2}
      shadowOffsetX={0}
      shadowOffsetY={8}
      shadowEnabled={!!node.parent}
      width={springs.width}
      height={springs.height}
      fill={fill}
    // fill={tailwind.blue[700]}
    />
    {labels.map((label) =>
      <Text
        key={label.text}
        x={label.pt[0]}
        y={label.pt[1]}
        offsetY={label.fontSize / 2}
        width={node.size.width - 2 * label.pt[0]}
        fill={loContrast}
        fontFamily='Helvetica'
        fontSize={label.fontSize}
        fontStyle={label.fontStyle ?? 'normal'}
        letterSpacing={0.8}
        align={label.align}
        text={label.text}
        wrap={'none'}
        ellipsis={true}
        padding={0}
        {...listeners}
        perfectDrawEnabled={false}
      />
    )}
    {/* <AnimatedText
      x={0}
      y={0}
      width={rectProps.width}
      fill={loContrast}
      fontSize={12}
      fontFamily={theme.font}
      wrap={'none'}
      ellipsis={true}
      align={'left'}
      text={node.title}
      padding={10}
      opacity={0.8}
      {...listeners}
    /> */}
  </AnimatedGroup>
}
