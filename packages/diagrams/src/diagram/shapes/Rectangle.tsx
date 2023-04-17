import type { DiagramNode } from '@likec4/core/types'
import { useSyncedRef } from '@react-hookz/web/esm'
import {
  animated,
  useSpring,
  type SpringValues
} from '@react-spring/konva'
import { useMemo } from 'react'
import type { DiagramTheme } from '../types'
import type { OnClickEvent, OnMouseEvent } from './types'
import { mouseDefault, mousePointer } from './utils'
import { NodeLabels } from './nodeLabels'

export interface RectangleShapeProps {
  animate?: boolean
  node: DiagramNode
  theme: DiagramTheme
  springs?: SpringValues<{
    opacity?: number
    scaleX?: number
    scaleY?: number
    width?: number
    height?: number
  }>
  onNodeClick?: ((node: DiagramNode) => void) | undefined
}

export const RectangleShape = ({
  animate = true,
  node,
  theme,
  springs,
  onNodeClick
}: RectangleShapeProps) => {
  const {
    id,
    size: { width, height },
    position: [x, y],
    color,
    labels
  } = node
  const offsetX = Math.round(width / 2)
  const offsetY = Math.round(height / 2)
  const { fill, shadow: shadowColor } = theme.colors[color]

  const springsRef = useSyncedRef(springs ?? null)

  const [groupProps] = useSpring(
    {
      to: {
        x: x + offsetX,
        y: y + offsetY,
        offsetX,
        offsetY
      },
      immediate: !animate
    },
    [x, y, offsetX, offsetY]
  )

  const rectProps = useSpring({
    to: {
      fill,
      shadowColor
    },
    immediate: !animate
  })

  const listeners = useMemo(() => {
    if (!onNodeClick) return {}
    return {
      onMouseEnter: (e: OnMouseEvent) => {
        mousePointer(e)
        if (animate && springsRef.current) {
          const cfg = {
            config: {
              duration: 200
            }
          }
          springsRef.current.scaleX?.start(1.06, cfg)
          springsRef.current.scaleY?.start(1.06, cfg)
        }
      },
      onMouseLeave: (e: OnMouseEvent) => {
        mouseDefault(e)
        if (animate && springsRef.current) {
          const cfg = {
            delay: 100,
            config: {
              duration: 120
            }
          }
          springsRef.current.scaleX?.start(1, cfg)
          springsRef.current.scaleY?.start(1, cfg)
        }
      },
      onClick: (evt: OnClickEvent) => {
        evt.cancelBubble = true
        onNodeClick(node)
      }
    }
  }, [node, onNodeClick ?? null, animate])

  return (
    // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error, @typescript-eslint/ban-ts-comment
    // @ts-ignore
    <animated.Group id={'node_' + id} {...listeners} {...springs} {...groupProps}>
      <animated.Rect
        cornerRadius={6}
        shadowBlur={12}
        shadowOpacity={0.3}
        shadowOffsetX={0}
        shadowOffsetY={8}
        {...rectProps}
        width={springs?.width}
        height={springs?.height}
      />
      <NodeLabels
        labels={labels}
        width={width}
        color={color}
        theme={theme}
      />
      {/* labels.map((label, i) =>
        <Text
          key={i}
          // x={label.pt[0]}
          x={8}
          width={width - 16}
          y={label.pt[1] - (label.fontSize / 2)}
          // offsetY={label.fontSize / 2}
          // offsetX={label.width / 2}
          // width={label.width}
          fill={hiContrast}
          fontFamily='Helvetica'
          fontSize={label.fontSize}
          padding={0}
          fontStyle={label.fontStyle ?? 'normal'}
          align={'center'}
          text={label.text}
        />
  )*/}
    </animated.Group>
  )
}
