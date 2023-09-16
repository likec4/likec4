import { config } from '@react-spring/konva'
import type { NodeSpringsCtrl } from '../springs'
import type { DiagramNode, KonvaPointerEvent, OnNodeClick } from '../types'
import { mouseDefault, mousePointer } from './utils'
import type { KonvaNodeEvents } from 'react-konva'
import { DiagramGesture } from '../state'

export function nodeListeners({
  node,
  ctrl,
  onNodeClick,
  setHoveredNode
}: {
  node: DiagramNode
  ctrl: NodeSpringsCtrl
  onNodeClick?: OnNodeClick | undefined
  setHoveredNode: (node: DiagramNode | null) => void
}): KonvaNodeEvents {
  if (!onNodeClick) {
    return {}
  }
  return {
    onPointerEnter: (e: KonvaPointerEvent) => {
      setHoveredNode(node)
      mousePointer(e)
      void ctrl.start({
        to: {
          scaleX: 1.08,
          scaleY: 1.08
        },
        default: false,
        config: config.stiff
      })
    },
    onPointerLeave: (e: KonvaPointerEvent) => {
      setHoveredNode(null)
      mouseDefault(e)
      void ctrl.start({
        to: {
          scaleX: 1,
          scaleY: 1
        },
        default: false,
        delay: 120,
        config: config.slow
      })
    },
    onPointerClick: (e: KonvaPointerEvent) => {
      if (DiagramGesture.isDragging || e.evt.button !== 0) {
        console.log('DiagramGesture.isDragging = true')
        return
      }
      console.log('onPointerClick', e)
      e.cancelBubble = true
      onNodeClick(node, e)
    }
  }
}
