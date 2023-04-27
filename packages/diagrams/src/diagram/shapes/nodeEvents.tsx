import type { DiagramNode } from '@likec4/core/types'
import { config } from '@react-spring/konva'
import type { NodeSpringsCtrl, OnClickEvent, OnMouseEvent } from './types'
import { mouseDefault, mousePointer } from './utils'

export function nodeListeners({
  node,
  ctrl,
  onNodeClick
}: {
  node: DiagramNode
  ctrl: NodeSpringsCtrl
  onNodeClick?: ((node: DiagramNode) => void) | undefined
}) {
  return {
    onClick: (e: OnClickEvent) => {
      if (onNodeClick) {
        e.cancelBubble = true
        onNodeClick(node)
      }
    },
    onMouseEnter: (e: OnMouseEvent) => {
      mousePointer(e)
      void ctrl.start({
        to: {
          scale: 1.08,
        },
        config: config.stiff
      })
    },
    onMouseLeave: (e: OnMouseEvent) => {
      mouseDefault(e)
      void ctrl.start({
        to: {
          scale: 1,
        },
        delay: 50,
        config: config.slow
      })
    }
  }
}
