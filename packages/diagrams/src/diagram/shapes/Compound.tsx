import type { DiagramNode } from '@likec4/core/types'
import { useSpring } from '@react-spring/konva'
import { useMemo } from 'react'
import { AnimatedGroup, AnimatedRect, Text } from '../../konva'

import type { DiagramTheme } from '../types'
import type { InterporatedNodeSprings, OnClickEvent, OnMouseEvent } from './types'
import { mouseDefault, mousePointer } from './utils'

interface CompoundProps {
  animate?: boolean
  node: DiagramNode
  theme: DiagramTheme
  springs: InterporatedNodeSprings
  onNodeClick?: ((node: DiagramNode) => void) | undefined
}

export const CompoundShape = ({
  animate = true,
  node,
  theme,
  springs,
  onNodeClick
}: CompoundProps) => {
  const { id, color, labels } = node
  const { loContrast, fill, shadow: shadowColor } = theme.colors[color]

  const rectProps = useSpring({
    to: {
      fill,
      shadowColor
    },
    immediate: !animate
  })

  const listeners = useMemo(() => {
    if (!onNodeClick) return {}
    return {
      onMouseEnter: (e: OnMouseEvent) => {
        mousePointer(e)
      },
      onMouseLeave: (e: OnMouseEvent) => {
        mouseDefault(e)
      },
      onClick: (evt: OnClickEvent) => {
        evt.cancelBubble = true
        onNodeClick(node)
      }
    }
  }, [node, onNodeClick ?? null])

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
      {...rectProps}
      opacity={0.25}
      cornerRadius={4}
      shadowBlur={12}
      shadowOpacity={0.45}
      shadowOffsetX={0}
      shadowOffsetY={8}
      width={springs.width}
      height={springs.height}
    />
      {labels.map((label, i) =>
        <Text
          key={i}
          x={label.pt[0]}
          y={label.pt[1]}
          offsetY={label.fontSize / 2}
          // offsetX={label.width / 2}
          width={node.size.width - 2*label.pt[0]}
          fill={loContrast}
          fontFamily='Helvetica'
          fontSize={label.fontSize}
          fontStyle={label.fontStyle ?? 'normal'}
          letterSpacing={0.8}
          align={label.align}
          text={label.text}
          wrap={'none'}
          ellipsis={true}
          {...listeners}
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
