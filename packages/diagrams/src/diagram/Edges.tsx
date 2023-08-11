import { KonvaCore } from '../konva'
import { EdgeShape } from './shapes/Edge'
import { mouseDefault, mousePointer } from './shapes/utils'
import type { LikeC4Theme, DiagramView, OnEdgeClick } from './types'
import { useTransition } from '@react-spring/konva'

type EdgesProps = {
  animate: boolean
  diagram: DiagramView
  theme: LikeC4Theme
  onEdgeClick?: OnEdgeClick | undefined
}

export function Edges({ animate, theme, diagram, onEdgeClick }: EdgesProps) {
  const edgeTransitions = useTransition(diagram.edges, {
    initial: {
      opacity: 1,
      width: 2
    },
    from: {
      opacity: 0.15,
      width: 2
    },
    enter: {
      opacity: 1
    },
    leave: {
      opacity: 0.05
    },
    expires: true,
    exitBeforeEnter: true,
    immediate: !animate,
    // delay: 30,
    config: {
      duration: 180,
      precision: 0.005
    },
    // unique edge key, scoped to this diagram
    // to avoid any issues with diagram-to-diagram transitions
    keys: e => e.id + diagram.id
  })
  return edgeTransitions((springs, edge, { key, ctrl }) => (
    <EdgeShape
      key={key}
      edge={edge}
      theme={theme}
      springs={springs}
      {...(onEdgeClick && {
        onPointerClick: e => {
          if (KonvaCore.isDragging()) {
            return
          }
          e.cancelBubble = true
          onEdgeClick(edge, e)
        },
        onPointerEnter: e => {
          void ctrl.start({
            to: {
              width: 3
            },
            delay: 100
          })
          mousePointer(e)
        },
        onPointerLeave: e => {
          void ctrl.start({
            to: {
              width: 2
            }
          })
          mouseDefault(e)
        }
      })}
    />
  ))
}
