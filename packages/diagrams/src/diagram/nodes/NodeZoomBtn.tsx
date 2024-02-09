import { isEqualSimple } from '@react-hookz/deep-equal'
import { useToggle } from '@react-hookz/web'
import { useSpring } from '@react-spring/konva'
import { lighten, mix, toHex } from 'khroma'
import { memo } from 'react'
import { AnimatedCircle, AnimatedGroup, Group } from '../../konva'
import { ZoomInIcon } from '../icons'
import type { NodeSpringsCtrl } from '../springs'
import { DiagramGesture } from '../state'
import type { DiagramNode, DiagramTheme, OnNodeClick } from '../types'
import { mouseDefault, mousePointer } from '../utils'

type NodeZoomBtn = {
  animate: boolean
  node: DiagramNode
  theme: DiagramTheme
  ctrl: NodeSpringsCtrl
  isHovered: boolean
  onNodeClick: OnNodeClick
}

export const NodeZoomBtn = memo<NodeZoomBtn>(({ animate, node, theme, isHovered: _isHovered, onNodeClick }) => {
  const size = 30
  const halfSize = size / 2
  const colors = theme.elements[node.color]
  let zoomInIconY: number
  switch (node.shape) {
    case 'browser':
    case 'mobile':
      zoomInIconY = node.size.height - 20
      break
    default:
      zoomInIconY = node.size.height - 16
  }
  const fill = toHex(mix(colors.fill, colors.stroke, 65))
  const onOver = toHex(mix(colors.fill, colors.stroke, 75))
  const [isOver, toggleOver] = useToggle(false)
  const isHovered = _isHovered || isOver
  const props = useSpring({
    to: {
      fill: isOver ? onOver : fill,
      opacity: isOver ? 1 : 0,
      y: zoomInIconY + (isOver ? 2 : 0),
      scale: isOver ? 1.38 : 1,
      // shadowBlur: isOver ? 6 : 4,
      shadowOpacity: isOver ? 0.3 : 0.15
      // shadowOffsetY: isOver ? 8 : 6
    },
    delay: isHovered && !isOver ? 100 : 0,
    immediate: !animate
  })
  return (
    <AnimatedGroup
      x={node.size.width / 2}
      y={props.y}
      offsetX={halfSize}
      offsetY={halfSize}
      scaleX={props.scale}
      scaleY={props.scale}
      width={size}
      height={size}
      onPointerEnter={e => {
        toggleOver(true)
        mousePointer(e)
      }}
      onPointerLeave={e => {
        toggleOver(false)
        mouseDefault(e)
      }}
      onPointerClick={e => {
        if (DiagramGesture.isDragging || e.evt.button !== 0) {
          return
        }
        e.cancelBubble = true
        onNodeClick(node, e)
      }}
    >
      <AnimatedCircle
        x={halfSize}
        y={halfSize}
        radius={halfSize}
        fill={props.fill}
        shadowBlur={4}
        shadowOpacity={props.shadowOpacity}
        shadowOffsetX={2}
        shadowOffsetY={6}
        shadowColor={theme.shadow}
        shadowEnabled={isHovered}
        perfectDrawEnabled={false}
        opacity={props.opacity}
        hitStrokeWidth={halfSize}
      />
      <ZoomInIcon size={16} x={halfSize} y={halfSize} />
    </AnimatedGroup>
  )
}, isEqualSimple)
NodeZoomBtn.displayName = 'NodeZoomBtn'

export const CompoundZoomBtn = memo<NodeZoomBtn>(({
  animate,
  node,
  theme,
  ctrl,
  isHovered: _isHovered,
  onNodeClick
}: NodeZoomBtn) => {
  const size = 28
  const [isOver, toggleOver] = useToggle(false)
  const halfSize = size / 2
  const fill = toHex(lighten(ctrl.springs.fill.get(), 10))
  const isHovered = _isHovered || isOver
  const props = useSpring({
    to: {
      opacity: isOver ? 1 : 0,
      x: halfSize + 4 - (isOver ? 4 : 0),
      y: halfSize + 6 - (isOver ? 4 : 0),
      scale: isOver ? 1.35 : 1,
      // shadowBlur: isOver ? 6 : 4,
      shadowOpacity: isOver ? 0.3 : 0.15
      // shadowOffsetY: isOver ? 8 : 6
    },
    delay: isHovered && !isOver ? 100 : 0,
    // delay: isOver ? 150 : (isHovered ? 70 : 0),
    immediate: !animate
  })
  return (
    <Group
      onPointerEnter={e => {
        toggleOver(true)
        mousePointer(e)
      }}
      onPointerLeave={e => {
        toggleOver(false)
        mouseDefault(e)
      }}
      onPointerClick={e => {
        if (DiagramGesture.isDragging || e.evt.button !== 0) {
          return
        }
        e.cancelBubble = true
        onNodeClick(node, e)
      }}
    >
      <AnimatedGroup
        x={props.x}
        y={props.y}
        offsetX={halfSize}
        offsetY={halfSize}
        scaleX={props.scale}
        scaleY={props.scale}
        width={size}
        height={size}
      >
        <AnimatedCircle
          x={halfSize}
          y={halfSize}
          radius={halfSize}
          fill={fill}
          shadowBlur={4}
          shadowOpacity={props.shadowOpacity}
          shadowOffsetX={2}
          shadowOffsetY={6}
          shadowColor={theme.shadow}
          shadowEnabled={isHovered}
          perfectDrawEnabled={false}
          opacity={props.opacity}
          hitStrokeWidth={halfSize}
        />
        <ZoomInIcon size={16} x={halfSize} y={halfSize} />
      </AnimatedGroup>
    </Group>
  )
}, isEqualSimple)
CompoundZoomBtn.displayName = 'CompoundZoomBtn'
