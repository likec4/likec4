import { config } from '@react-spring/konva'
import { KonvaCore } from '../../konva'
import type { NodeSpringsCtrl } from '../springs'
import type { DiagramNode, KonvaPointerEvent, OnNodeClick } from '../types'
import { mouseDefault, mousePointer } from './utils'
import type { KonvaNodeEvents } from 'react-konva'

export function nodeListeners({
  node,
  ctrl,
  onNodeClick
}: {
  node: DiagramNode
  ctrl: NodeSpringsCtrl
  onNodeClick?: OnNodeClick | undefined
}): KonvaNodeEvents {
  if (!onNodeClick) {
    return {}
  }
  return {
    onPointerEnter: (e: KonvaPointerEvent) => {
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
      if (KonvaCore.isDragging() || e.evt.button !== 0) {
        return
      }
      e.cancelBubble = true
      onNodeClick(node, e)
    }
  }
}
