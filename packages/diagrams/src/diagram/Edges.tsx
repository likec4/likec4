import { useMemo } from 'react'
import { Group } from '../konva'
import { EdgeShape } from './shapes/Edge'
import { mouseDefault, mousePointer } from './shapes/utils'
import { DiagramGesture, useHoveredEdgeId, useSetHoveredEdge } from './state'
import type { LikeC4Theme, DiagramView, OnEdgeClick } from './types'
import { useTransition } from '@react-spring/konva'
import { scale, toHex } from 'khroma'

type EdgesProps = {
  animate: boolean
  diagram: DiagramView
  theme: LikeC4Theme
  onEdgeClick?: OnEdgeClick | undefined
}

const edgeColors = (
  { relation: { lineColor, labelColor } }: LikeC4Theme,
  isHovered = false
): {
  lineColor: string
  labelColor: string
} => {
  if (Array.isArray(lineColor)) {
    lineColor = isHovered ? lineColor[1].onHover : lineColor[0]
  } else if (isHovered) {
    lineColor = toHex(
      scale(lineColor, {
        l: 35,
        s: -5
      })
    ) as `#${string}`
  }
  if (Array.isArray(labelColor)) {
    labelColor = isHovered ? labelColor[1].onHover : labelColor[0]
  } else if (isHovered) {
    labelColor = toHex(
      scale(labelColor, {
        l: 50
      })
    ) as `#${string}`
  }
  return {
    lineColor,
    labelColor
  }
}

export function Edges({ animate, theme, diagram, onEdgeClick }: EdgesProps) {
  const hoveredEdgeId = useHoveredEdgeId()
  const setHoveredEdge = useSetHoveredEdge()

  const colors = useMemo(
    () => ({
      base: edgeColors(theme),
      onHover: edgeColors(theme, true)
    }),
    [theme]
  )

  const edgeTransitions = useTransition(diagram.edges, {
    initial: {
      opacity: 1,
      lineWidth: 2,
      ...colors.base
    },
    from: {
      opacity: 0.15,
      lineWidth: 2,
      ...colors.base
    },
    update: edge => {
      const isHovered = hoveredEdgeId === edge.id
      return {
        opacity: 1,
        lineWidth: isHovered ? 3 : 2,
        ...(isHovered ? colors.onHover : colors.base)
      }
    },
    enter: {
      opacity: 1
    },
    leave: {
      opacity: 0.05,
      lineWidth: 2,
      ...colors.base
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
          setHoveredEdge(edge)
          mousePointer(e)
        },
        onPointerLeave: e => {
          setHoveredEdge(null)
          mouseDefault(e)
        }
      })}
    >
      <EdgeShape
        edge={edge}
        isHovered={hoveredEdgeId === edge.id}
        theme={theme}
        springs={springs}
      />
    </Group>
  ))
}
