import { useMemo } from 'react'
import { Group } from '../konva'
import { EdgeShape } from './shapes/Edge'
import { mouseDefault, mousePointer } from './shapes/utils'
import { DiagramGesture, useHoveredEdgeId, useSetHoveredEdge } from './state'
import type { LikeC4Theme, DiagramView, OnEdgeClick, DiagramEdge } from './types'
import { useTransition } from '@react-spring/konva'
import { scale, toHex } from 'khroma'
import type { ThemeColor, ThemeRelationColors } from '@likec4/core'
import { DefaultRelationshipColor } from '@likec4/core'

type EdgesProps = {
  animate: boolean
  diagram: DiagramView
  theme: LikeC4Theme
  onEdgeClick?: OnEdgeClick | undefined
}

// const edgeColors = (
//   { relation: { lineColor, labelBgColor, labelColor } }: LikeC4Theme,
//   isHovered = false
// ): {
//   lineColor: string
//   labelBgColor: string
//   labelColor: string
// } => {
//   if (isHovered) {
//     lineColor = toHex(
//       scale(lineColor, {
//         l: 35,
//         s: -5
//       })
//     ) as `#${string}`
//     labelColor = toHex(
//       scale(labelColor, {
//         l: 50
//       })
//     ) as `#${string}`
//   }
//   return {
//     lineColor,
//     labelBgColor,
//     labelColor
//   }
// }
const gray = {
  lineColor: '#6E6E6E',
  labelBgColor: '#18191b',
  labelColor: '#C6C6C6'
} satisfies ThemeRelationColors
const slate = {
  lineColor: '#64748b', // 500
  labelBgColor: '#0f172a', // 900
  labelColor: '#cbd5e1' // 300
} satisfies ThemeRelationColors

const blue = {
  lineColor: '#3b82f6', // 500
  labelBgColor: '#172554', // 950
  labelColor: '#60a5fa' // 400
} satisfies ThemeRelationColors

const sky = {
  lineColor: '#0ea5e9', // 500
  labelBgColor: '#082f49', // 950
  labelColor: '#38bdf8' // 400
} satisfies ThemeRelationColors

const Colors = {
  amber: {
    lineColor: '#b45309',
    labelBgColor: '#78350f',
    labelColor: '#f59e0b'
  },
  blue,
  gray,
  green: {
    lineColor: '#15803d', // 700
    labelBgColor: '#14532d', //900
    labelColor: '#22c55e' // 500
  },
  indigo: {
    lineColor: '#6366f1', // 500
    labelBgColor: '#1e1b4b', // 950
    labelColor: '#818cf8' // 400
  },
  muted: slate,
  primary: blue,
  red: {
    lineColor: '#b91c1c',
    labelBgColor: '#b91c1c',
    labelColor: '#dc2626'
  },
  secondary: sky,
  sky,
  slate
} satisfies Record<ThemeColor, ThemeRelationColors>

function edgeSprings(edge: DiagramEdge) {
  const { labelBgColor, labelColor, lineColor } = Colors[edge.color ?? DefaultRelationshipColor]
  return {
    opacity: 1,
    lineWidth: 2,
    lineColor: lineColor as string,
    labelBgColor: labelBgColor as string,
    labelColor: labelColor as string
  }
}

export function Edges({ animate, theme, diagram, onEdgeClick }: EdgesProps) {
  const hoveredEdgeId = useHoveredEdgeId()
  const setHoveredEdge = useSetHoveredEdge()

  // const colors = useMemo(
  //   () => ({
  //     base: edgeColors(theme),
  //     onHover: edgeColors(theme, true)
  //   }),
  //   [theme]
  // )

  const edgeTransitions = useTransition(diagram.edges, {
    from: ((edge: DiagramEdge) => ({
      ...edgeSprings(edge),
      opacity: 0.15,
      lineWidth: 2
    })) as unknown as ReturnType<typeof edgeSprings>,
    initial: edgeSprings,
    update: edge => {
      const isHovered = hoveredEdgeId === edge.id
      return {
        ...edgeSprings(edge),
        opacity: 1,
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
