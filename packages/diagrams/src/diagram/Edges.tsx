import type { RelationshipThemeColorValues } from '@likec4/core'
import { DefaultRelationshipColor } from '@likec4/core'
import { useTransition } from '@react-spring/konva'
import { scale, toHex } from 'khroma'
import { memoize } from 'rambdax'
import { useCallback } from 'react'
import { Group } from '../konva'
import { EdgeShape } from './shapes/Edge'
import { mouseDefault, mousePointer } from './shapes/utils'
import { DiagramGesture, useHoveredEdgeId, useSetHoveredEdge } from './state'
import type { DiagramEdge, DiagramView, LikeC4Theme, OnEdgeClick } from './types'

type EdgesProps = {
  animate: boolean
  diagram: DiagramView
  theme: LikeC4Theme
  onEdgeClick?: OnEdgeClick | undefined
}

const edgeColors = memoize((colors: RelationshipThemeColorValues, isHovered: boolean) => {
  if (isHovered) {
    return {
      lineColor: toHex(
        scale(colors.lineColor, {
          l: 25,
          s: -5
        })
      ),
      labelColor: toHex(
        scale(colors.labelColor, {
          l: 40
        })
      ),
      labelBgColor: toHex(
        scale(colors.labelBgColor, {
          l: -10
        })
      )
    }
  } else {
    return colors
  }
})

export function Edges({ animate, theme, diagram, onEdgeClick }: EdgesProps) {
  const hoveredEdgeId = useHoveredEdgeId()
  const setHoveredEdge = useSetHoveredEdge()

  const edgeSprings = useCallback(
    (edge: DiagramEdge, isHovered = false) => {
      return {
        opacity: 1,
        lineWidth: 2,
        ...edgeColors(theme.relationships[edge.color ?? DefaultRelationshipColor], isHovered)
      }
    },
    [theme]
  )

  const edgeTransitions = useTransition(diagram.edges, {
    from: ((edge: DiagramEdge) => ({
      ...edgeSprings(edge),
      opacity: 0.15,
      lineWidth: 2
    })) as unknown as ReturnType<typeof edgeSprings>,
    initial: edge => edgeSprings(edge),
    update: edge => {
      const isInactive = animate && hoveredEdgeId !== null && hoveredEdgeId !== edge.id
      const isHovered = animate && hoveredEdgeId === edge.id
      return {
        ...edgeSprings(edge, isHovered),
        opacity: isInactive ? 0.4 : 1,
        lineWidth: isHovered ? 3 : 2
      }
    },
    enter: {
      opacity: 1
    },
    leave: edge => {
      return {
        ...edgeSprings(edge),
        opacity: 0.05,
        lineWidth: 2
      }
    },
    expires: true,
    exitBeforeEnter: true,
    immediate: !animate,
    // delay: 30,
    config: {
      duration: 160,
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
          if (animate) {
            setHoveredEdge(edge)
            mousePointer(e)
          }
        },
        onPointerLeave: e => {
          setHoveredEdge(null)
          mouseDefault(e)
        }
      })}
    >
      <EdgeShape
        animate={animate}
        edge={edge}
        isHovered={hoveredEdgeId === edge.id}
        theme={theme}
        springs={springs}
      />
    </Group>
  ))
}
