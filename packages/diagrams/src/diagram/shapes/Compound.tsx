import type { DiagramNode } from '@likec4/core/types'
import { useFirstMountState } from '@react-hookz/web/esm'
import { animated, useSpring, type SpringValues } from '@react-spring/konva'
import { useMemo } from 'react'

import type { DiagramTheme } from '../types'
import type { OnClickEvent, OnMouseEvent } from './types'
import { mouseDefault, mousePointer } from './utils'

interface CompoundProps {
  animate?: boolean,
  node: DiagramNode
  theme: DiagramTheme
  springs?: SpringValues<{
    opacity?: number
    scaleX?: number
    scaleY?: number
  }>
  onNodeClick?: ((node: DiagramNode) => void) | undefined
}

export const CompoundShape = ({
  animate = true,
  node,
  theme,
  springs,
  onNodeClick
}: CompoundProps) => {
  const { id, size: { width, height }, position: [x, y], color } = node
  const offsetX = Math.round(width / 2)
  const offsetY = Math.round(height / 2)
  const {
    hiContrast,
    fill,
    shadow: shadowColor
  } = theme.colors[color]

  const isFirstRender = useFirstMountState()

  const [groupProps, _groupPropsApi] = useSpring({
    delay: isFirstRender && animate ? 30 : 0,
    to: {
      x: x + offsetX,
      y: y + offsetY,
      offsetX,
      offsetY,
      width,
      height,
    },
    immediate: !animate
  }, [x, y, offsetX, offsetY])

  const rectProps = useSpring({
    to: {
      width,
      height,
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
      },
      onMouseLeave: (e: OnMouseEvent) => {
        mouseDefault(e)
      },
      onClick: (evt: OnClickEvent) => {
        evt.cancelBubble = true
        onNodeClick(node)
      }
    }
  }, [node, onNodeClick ?? null])

  // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error, @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return <animated.Group
    {...groupProps}
    {...springs}
    id={'compound_' + id}
  >
    <animated.Rect
      {...rectProps}
      opacity={0.25}
      cornerRadius={4}
      shadowBlur={12}
      shadowOpacity={0.45}
      shadowOffsetX={0}
      shadowOffsetY={8}
    />
    <animated.Text
      x={0}
      y={0}
      width={rectProps.width}
      fill={hiContrast}
      fontSize={12}
      fontFamily={theme.font}
      wrap={'none'}
      ellipsis={true}
      align={'left'}
      text={node.title}
      padding={10}
      opacity={0.7}
      {...listeners}
    />
  </animated.Group>
}
