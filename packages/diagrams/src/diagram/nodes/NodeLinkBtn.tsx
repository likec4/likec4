import { invariant } from '@likec4/core'
import { isEqualSimple } from '@react-hookz/deep-equal/esnext'
import { useToggle } from '@react-hookz/web'
import { useSpring } from '@react-spring/konva'
import { mix, toHex } from 'khroma'
import { memo } from 'react'
import { AnimatedCircle, AnimatedGroup } from '../../konva'
import { LinkIcon } from '../icons'
import type { NodeSpringsCtrl } from '../springs'
import { DiagramGesture } from '../state'
import type { DiagramNode, DiagramTheme } from '../types'
import { mouseDefault, mousePointer } from '../utils'

type NodeLinkBtnProps = {
  animate: boolean
  node: DiagramNode
  theme: DiagramTheme
  ctrl: NodeSpringsCtrl
  isHovered: boolean
}

export const NodeLinkBtn = memo<NodeLinkBtnProps>(
  ({ animate, node, theme, isHovered: _isHovered }: NodeLinkBtnProps) => {
    const links = node.links
    invariant(links, 'NodeLinkBtn: node.links is undefined')
    const size = 30
    const halfSize = size / 2
    const colors = theme.elements[node.color]

    let iconX: number
    switch (node.shape) {
      case 'browser': {
        iconX = 21
        break
      }
      case 'mobile': {
        iconX = 16
        break
      }
      case 'queue': {
        iconX = 26
        break
      }
      case 'cylinder':
      case 'storage': {
        iconX = 14
        break
      }
      default:
        iconX = 16
    }

    let iconY: number
    switch (node.shape) {
      case 'browser': {
        iconY = node.size.height - 20
        break
      }
      case 'queue': {
        iconY = node.size.height - 14
        break
      }
      case 'cylinder':
      case 'storage': {
        iconY = node.size.height - 22
        break
      }
      default:
        iconY = node.size.height - 16
    }

    const fill = toHex(mix(colors.fill, colors.stroke, 65))
    const onOver = toHex(mix(colors.fill, colors.stroke, 75))
    const [isOver, toggleOver] = useToggle(false)
    const isHovered = _isHovered || isOver
    const props = useSpring({
      to: {
        fill: isOver ? onOver : fill,
        opacity: isOver ? 1 : 0,
        // y: zoomInIconY + (isOver ? 2 : 0),
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
        x={iconX}
        y={iconY}
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
          e.evt.stopPropagation()
          if (!window.open(links[0], '_blank')) {
            window.alert('Please allow popups for this website')
          }
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
        <LinkIcon
          size={isHovered ? 16 : 14}
          opacity={isHovered ? 1 : 0.9}
          x={halfSize}
          y={halfSize}
        />
      </AnimatedGroup>
    )
  },
  isEqualSimple
)
NodeLinkBtn.displayName = 'NodeLinkBtn'
