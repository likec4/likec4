import { AnimatedGroup, AnimatedRect, KonvaCore, Text } from '../../konva'
import { scale } from 'khroma'
import type { DiagramTheme, DiagramNode } from '../types'
import type { InterporatedNodeSprings, OnNodeClick, OnPointerEvent } from './types'
import { mouseDefault, mousePointer } from './utils'

interface CompoundProps {
  id?: string
  animate?: boolean
  node: DiagramNode
  theme: DiagramTheme
  springs: InterporatedNodeSprings
  onNodeClick?: OnNodeClick | undefined
}

export function CompoundShape({ id, node, theme, springs, onNodeClick }: CompoundProps) {
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

  const listeners = {}
  if (onNodeClick) {
    Object.assign(listeners, {
      onPointerEnter: (e: OnPointerEvent) => {
        mousePointer(e)
      },
      onPointerLeave: (e: OnPointerEvent) => {
        mouseDefault(e)
      },
      onPointerClick: (evt: OnPointerEvent) => {
        if (KonvaCore.isDragging()) {
          return
        }
        evt.cancelBubble = true
        onNodeClick(node, evt)
      }
    })
  }
  return (
    <AnimatedGroup id={id} {...springs}>
      <AnimatedRect
        cornerRadius={4}
        shadowColor={theme.shadow}
        shadowBlur={12}
        shadowOpacity={0.2}
        shadowOffsetX={0}
        shadowOffsetY={8}
        shadowEnabled={!!node.parent}
        width={springs.width}
        height={springs.height}
        fill={fill}
        strokeEnabled={false}
      />
      {labels.map(label => (
        <Text
          key={label.text}
          x={label.pt[0]}
          y={label.pt[1]}
          offsetY={label.fontSize / 2}
          width={node.size.width - 2 * label.pt[0]}
          fill={loContrast}
          fontFamily={theme.font}
          fontSize={label.fontSize}
          fontStyle={label.fontStyle ?? 'normal'}
          letterSpacing={0.8}
          align={label.align}
          text={label.text}
          wrap={'none'}
          ellipsis={true}
          perfectDrawEnabled={false}
          padding={0}
          {...listeners}
        />
      ))}
      {/* <ExternalLink
          x={-5}
          y={36}
          fill={colors.fill}
          fillIcon={colors.loContrast}
          {...toolbarProps}
        /> */}
    </AnimatedGroup>
  )
}
