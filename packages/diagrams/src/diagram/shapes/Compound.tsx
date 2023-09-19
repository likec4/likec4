import { scale } from 'khroma'
import type { KonvaNodeEvents } from 'react-konva'
import { AnimatedGroup, AnimatedRect, Text } from '../../konva'
import type { NodeSpringValues } from '../springs'
import { DiagramGesture, useSetHoveredNode } from '../state'
import type { DiagramNode, DiagramTheme, KonvaPointerEvent, OnNodeClick } from '../types'
import { mouseDefault, mousePointer } from './utils'

interface CompoundProps {
  node: DiagramNode
  theme: DiagramTheme
  springs: NodeSpringValues
  onNodeClick?: OnNodeClick | undefined
}

export function CompoundShape({ node, theme, springs, onNodeClick }: CompoundProps) {
  const setHoveredNode = useSetHoveredNode()
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

  const listeners: KonvaNodeEvents = onNodeClick
    ? {
        onPointerEnter: (e: KonvaPointerEvent) => {
          mousePointer(e)
          setHoveredNode(node)
        },
        onPointerLeave: (e: KonvaPointerEvent) => {
          mouseDefault(e)
          setHoveredNode(null)
        },
        onPointerClick: (e: KonvaPointerEvent) => {
          if (DiagramGesture.isDragging || e.evt.button !== 0) {
            return
          }
          e.cancelBubble = true
          onNodeClick(node, e)
        }
      }
    : {}

  return (
    <AnimatedGroup name={node.id} {...springs}>
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
        listening={false}
      />
      {labels.map(({ pt: [x, y], ...label }, i) => (
        <Text
          key={i}
          x={x}
          y={y - label.fontSize / 2}
          offsetX={4}
          offsetY={4}
          width={node.size.width - x - 4}
          fill={'#AEAEAE'}
          fontFamily={theme.font}
          fontSize={label.fontSize}
          fontStyle={label.fontStyle ?? 'normal'}
          letterSpacing={0.8}
          align={label.align}
          text={label.text}
          wrap={'none'}
          ellipsis={true}
          perfectDrawEnabled={false}
          padding={6}
          hitStrokeWidth={3}
          globalCompositeOperation={'luminosity'}
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
