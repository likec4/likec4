import { Group } from '../konva'
import { EdgeShape } from './shapes/Edge'
import { mouseDefault, mousePointer } from './shapes/utils'
import { DiagramGesture, useHoveredEdgeId, useSetHoveredEdge } from './state'
import type { LikeC4Theme, DiagramView, OnEdgeClick } from './types'
import { useTransition } from '@react-spring/konva'

type EdgesProps = {
  animate: boolean
  diagram: DiagramView
  theme: LikeC4Theme
  onEdgeClick?: OnEdgeClick | undefined
}

export function Edges({ animate, theme, diagram, onEdgeClick }: EdgesProps) {
  const hoveredEdgeId = useHoveredEdgeId()
  const setHoveredEdge = useSetHoveredEdge()
  const edgeTransitions = useTransition(diagram.edges, {
    initial: {
      opacity: 1,
      lineWidth: 2,
      lineColor: theme.relation.lineColor as string,
      labelColor: theme.relation.labelColor as string
    },
    from: {
      opacity: 0.15,
      lineWidth: 2,
      lineColor: theme.relation.lineColor as string,
      labelColor: theme.relation.labelColor as string
    },
    update: edge => {
      const isHovered = hoveredEdgeId === edge.id
      return {
        opacity: 1,
        lineWidth: isHovered ? 3 : 2,
        lineColor: (isHovered ? '#F8F3D4' : theme.relation.lineColor) as string,
        labelColor: (isHovered ? '#F8F3D4' : theme.relation.labelColor) as string
      }
    },
    enter: {
      opacity: 1
    },
    leave: {
      opacity: 0.05,
      lineWidth: 2,
      lineColor: theme.relation.lineColor as string,
      labelColor: theme.relation.labelColor as string
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
  return edgeTransitions((springs, edge, { key }) => (
    <Group
      key={key}
      {...(onEdgeClick && {
        onPointerClick: e => {
          if (DiagramGesture.isDragging || e.evt.button !== 0) {
            return
          }
          e.cancelBubble = true
          onEdgeClick(edge, e)
        },
        onPointerEnter: e => {
          setHoveredEdge(edge)
          mousePointer(e)
        },
        onPointerLeave: e => {
          setHoveredEdge(null)
          mouseDefault(e)
        }
      })}
    >
      <EdgeShape edge={edge} theme={theme} springs={springs} />
    </Group>
  ))
}
