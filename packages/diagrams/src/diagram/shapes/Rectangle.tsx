import type { DiagramNode, ThemeColor } from '@likec4/core/types'
import { isEqualReactSimple as deepEqual } from '@react-hookz/deep-equal/esm'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type Konva from 'konva'
import { Group, Text } from 'react-konva'
import { SpringValue, animated, useSpring, type SpringValues, Controller } from '@react-spring/konva'
import type { OnClickEvent, OnMouseEvent } from './types'
import type { DiagramTheme } from '../types'
import { mouseDefault, mousePointer } from './utils'
import { useFirstMountState, useSyncedRef } from '@react-hookz/web/esm'


const Sizes = {
  width: 250,
  maxWidth: 330,
  height: 140,
  padding: 24,
  title: {
    fontSize: 15,
    lineHeight: 1.15
  },
  description: {
    fontSize: 13,
    lineHeight: 1.15
  }
} as const

type NodeTitleProps = Omit<Konva.GroupConfig, 'offsetY' | 'y'> & {
  y: number
  title: string
  description?: string | null
  color: ThemeColor
  width: number
  theme: DiagramTheme
}


export const NodeTitle = memo(({
  title,
  description,
  color,
  width,
  theme,
  ...props
}: NodeTitleProps) => {
  const colors = theme.colors[color]

  const hasDescription = description && description.length > 0

  const titleRef = useRef<Konva.Text | null>(null)
  const descriptionRef = useRef<Konva.Text | null>(null)

  const [[titleHeight, descHeight], setHeights] = useState([
    Sizes.title.lineHeight * Sizes.title.fontSize + Sizes.padding * 2,
    hasDescription ? Sizes.description.lineHeight * Sizes.description.fontSize + Sizes.padding * 2 : 0
  ] as const)

  useEffect(() => {
    if (!titleRef.current) return
    const titleHeight = titleRef.current.height()
    const descHeight = descriptionRef.current?.height() ?? 0
    setHeights([titleHeight, descHeight])
  }, [title, description, width])

  const descYDelta = Sizes.padding + Sizes.title.fontSize

  const groupHeight = titleHeight + (hasDescription ? (descHeight - descYDelta) : 0)
  const offsetY = Math.round(groupHeight / 2)

  return <Group {...props} offsetY={offsetY} _useStrictMode>
    <Text
      ref={titleRef}
      x={0}
      y={0}
      width={width}
      fill={colors.hiContrast}
      fontSize={Sizes.title.fontSize}
      fontFamily={theme.font}
      lineHeight={Sizes.title.lineHeight}
      align={'center'}
      padding={Sizes.padding}
      text={title}
      _useStrictMode
    />
    {hasDescription &&
      <Text
        ref={descriptionRef}
        x={0}
        y={titleHeight - descYDelta}
        width={width}
        fill={colors.loContrast}
        fontSize={Sizes.description.fontSize}
        fontFamily={theme.font}
        lineHeight={Sizes.description.lineHeight}
        align={'center'}
        padding={Sizes.padding}
        text={description}
        _useStrictMode
      />
    }
  </Group>
}, deepEqual)


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
  const { id, size: { width, height }, position: [x, y], color } = node
  const offsetX = Math.round(width / 2)
  const offsetY = Math.round(height / 2)
  const {
    fill,
    shadow: shadowColor
  } = theme.colors[color]

  const springsRef = useSyncedRef(springs ?? null)

  const [groupProps] = useSpring({
    to: {
      x: x + offsetX,
      y: y + offsetY,
      offsetX,
      offsetY,
    },
    immediate: !animate
  }, [x, y, offsetX, offsetY])

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

  // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error, @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return <animated.Group
    id={'node_' + id}
    {...listeners}
    {...springs}
    {...groupProps}
  >
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
    <NodeTitle
      y={offsetY}
      title={node.title}
      description={node.description ?? null}
      color={color}
      width={width}
      theme={theme}
    />
  </animated.Group>
}
