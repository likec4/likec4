import { KonvaCore } from '../../konva'
import type { OnNodeClick, KonvaPointerEvent, DiagramNode } from '../types'
import { mouseDefault, mousePointer } from './utils'
import type { NodeSpringsCtrl } from '../springs'
import { config } from '@react-spring/konva'

export function nodeListeners({
  node,
  ctrl,
  onNodeClick
}: {
  node: DiagramNode
  ctrl: NodeSpringsCtrl
  onNodeClick?: OnNodeClick | undefined
}) {
  if (!onNodeClick) {
    return {} as const
  }
  return {
    onPointerEnter: (e: KonvaPointerEvent) => {
      mousePointer(e)
      void ctrl.start({
        to: {
          scaleX: 1.08,
          scaleY: 1.08
        },
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
        delay: 100,
        config: config.slow
      })
    },
    onPointerClick: (e: KonvaPointerEvent) => {
      if (KonvaCore.isDragging()) {
        return
      }
      e.cancelBubble = true
      onNodeClick(node, e)
    }
  } as const
}
