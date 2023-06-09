import type { DiagramNode } from '@likec4/core'
import { config } from '@react-spring/konva'
import type { NodeSpringsCtrl, OnNodeClick, OnPointerEvent } from './types'
import { mouseDefault, mousePointer } from './utils'
import KonvaCore from 'konva/lib/Core'

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
    onPointerEnter: (e: OnPointerEvent) => {
      mousePointer(e)
      void ctrl.start({
        to: {
          scale: 1.08,
        },
        config: config.stiff
      })
    },
    onPointerLeave: (e: OnPointerEvent) => {
      mouseDefault(e)
      void ctrl.start({
        to: {
          scale: 1,
        },
        delay: 100,
        config: config.slow
      })
    },
    onPointerClick: (e: OnPointerEvent) => {
      if (KonvaCore.isDragging()) {
        return
      }
      e.cancelBubble = true
      onNodeClick(node, e)
    }
  } as const
}
